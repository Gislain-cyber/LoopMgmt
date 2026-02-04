Option Explicit

'=============================================================================
' GANTT CHART - CLEAN VERSION
' Run QuickSetup first, then manually run RefreshGanttChart when needed
'=============================================================================

Public Sub QuickSetup()
    Application.EnableEvents = False
    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    
    Call SetupTeamMembers
    Call CreateGanttChart
    Call CreateDashboard
    
    Application.Calculation = xlCalculationAutomatic
    Application.ScreenUpdating = True
    Application.EnableEvents = True
    
    MsgBox "Setup Complete!" & vbCrLf & vbCrLf & _
           "Run 'RefreshGanttChart' to update colors and bars.", vbInformation
End Sub

Public Sub SetupTeamMembers()
    Dim wsTeam As Worksheet
    Dim i As Integer
    
    On Error Resume Next
    Set wsTeam = ThisWorkbook.Sheets("Team Members")
    On Error GoTo 0
    
    If wsTeam Is Nothing Then
        Set wsTeam = ThisWorkbook.Sheets.Add(After:=ThisWorkbook.Sheets(ThisWorkbook.Sheets.Count))
        wsTeam.Name = "Team Members"
    End If
    
    wsTeam.Cells.Clear
    
    ' Headers
    wsTeam.Range("A1:F1").Value = Array("Name", "Role", "Color", "Email", "Target Hrs", "Assigned Hrs")
    With wsTeam.Range("A1:F1")
        .Font.Bold = True
        .Interior.Color = RGB(33, 37, 41)
        .Font.Color = RGB(255, 255, 255)
    End With
    
    ' Team Data (customize names and target hours here)
    wsTeam.Range("A2").Value = "Bander Bakalka"
    wsTeam.Range("B2").Value = "PM"
    wsTeam.Range("C2").Interior.Color = RGB(255, 87, 87)
    wsTeam.Range("E2").Value = 40
    
    wsTeam.Range("A3").Value = "Jon Klomfass"
    wsTeam.Range("B3").Value = "Lead"
    wsTeam.Range("C3").Interior.Color = RGB(255, 189, 89)
    wsTeam.Range("E3").Value = 40
    
    wsTeam.Range("A4").Value = "Gislain Hotcho Nkenga"
    wsTeam.Range("B4").Value = "Lead"
    wsTeam.Range("C4").Interior.Color = RGB(255, 214, 102)
    wsTeam.Range("E4").Value = 40
    
    wsTeam.Range("A5").Value = "Cirex Peroche"
    wsTeam.Range("B5").Value = "Member"
    wsTeam.Range("C5").Interior.Color = RGB(100, 181, 246)
    wsTeam.Range("E5").Value = 40
    
    wsTeam.Range("A6").Value = "Davis Oliver"
    wsTeam.Range("B6").Value = "Member"
    wsTeam.Range("C6").Interior.Color = RGB(129, 199, 132)
    wsTeam.Range("E6").Value = 40
    
    wsTeam.Range("A7").Value = "Josh Kavanagh"
    wsTeam.Range("B7").Value = "Member"
    wsTeam.Range("C7").Interior.Color = RGB(186, 104, 200)
    wsTeam.Range("E7").Value = 40
    
    wsTeam.Range("A8").Value = "Lucas Pasia"
    wsTeam.Range("B8").Value = "Member"
    wsTeam.Range("C8").Interior.Color = RGB(255, 138, 128)
    wsTeam.Range("E8").Value = 40
    
    wsTeam.Range("A9").Value = "Luke Kivell"
    wsTeam.Range("B9").Value = "Member"
    wsTeam.Range("C9").Interior.Color = RGB(128, 222, 234)
    wsTeam.Range("E9").Value = 40
    
    wsTeam.Range("A10").Value = "Sebastian Chandler"
    wsTeam.Range("B10").Value = "Member"
    wsTeam.Range("C10").Interior.Color = RGB(255, 183, 77)
    wsTeam.Range("E10").Value = 40
    
    wsTeam.Range("A11").Value = "Anmol Singh Saini"
    wsTeam.Range("B11").Value = "Member"
    wsTeam.Range("C11").Interior.Color = RGB(174, 213, 129)
    wsTeam.Range("E11").Value = 40
    
    wsTeam.Range("A12").Value = "Anton Makaranka"
    wsTeam.Range("B12").Value = "Member"
    wsTeam.Range("C12").Interior.Color = RGB(149, 117, 205)
    wsTeam.Range("E12").Value = 40
    
    wsTeam.Range("A13").Value = "Blake Alexander"
    wsTeam.Range("B13").Value = "Member"
    wsTeam.Range("C13").Interior.Color = RGB(77, 208, 225)
    wsTeam.Range("E13").Value = 40
    
    wsTeam.Range("A14").Value = "Joel Reyes"
    wsTeam.Range("B14").Value = "Member"
    wsTeam.Range("C14").Interior.Color = RGB(255, 167, 38)
    wsTeam.Range("E14").Value = 40
    
    wsTeam.Range("A15").Value = "Ren Falkenrath"
    wsTeam.Range("B15").Value = "Member"
    wsTeam.Range("C15").Interior.Color = RGB(236, 64, 122)
    wsTeam.Range("E15").Value = 40
    
    ' Assigned hours formulas
    For i = 2 To 15
        wsTeam.Cells(i, 6).Formula = "=SUMIF('Gantt Chart'!C:C,A" & i & ",'Gantt Chart'!H:H)"
    Next i
    
    wsTeam.Columns("A:F").AutoFit
End Sub

Public Sub CreateGanttChart()
    Dim wsGantt As Worksheet
    Dim i As Integer
    Dim j As Integer
    Dim projectStart As Date
    Dim numDays As Integer
    Dim startDateCol As Integer
    Dim currentMonth As Integer
    Dim prevMonth As Integer
    Dim monthStartCol As Integer
    
    On Error Resume Next
    Set wsGantt = ThisWorkbook.Sheets("Gantt Chart")
    On Error GoTo 0
    
    If wsGantt Is Nothing Then
        Set wsGantt = ThisWorkbook.Sheets.Add(After:=ThisWorkbook.Sheets(ThisWorkbook.Sheets.Count))
        wsGantt.Name = "Gantt Chart"
    End If
    
    wsGantt.Cells.Clear
    
    ' Task Info Header (Row 1)
    wsGantt.Range("A1:M1").Merge
    wsGantt.Range("A1").Value = "TASK INFORMATION"
    With wsGantt.Range("A1")
        .HorizontalAlignment = xlCenter
        .Font.Bold = True
        .Interior.Color = RGB(33, 37, 41)
        .Font.Color = RGB(255, 255, 255)
    End With
    
    ' Column Headers (Row 2)
    wsGantt.Range("A2").Value = "ID"
    wsGantt.Range("B2").Value = "Task Name"
    wsGantt.Range("C2").Value = "Assigned To"
    wsGantt.Range("D2").Value = "Role"
    wsGantt.Range("E2").Value = "Start Date"
    wsGantt.Range("F2").Value = "End Date"
    wsGantt.Range("G2").Value = "Days"
    wsGantt.Range("H2").Value = "Est Hrs"
    wsGantt.Range("I2").Value = "Actual Hrs"
    wsGantt.Range("J2").Value = "Remaining"
    wsGantt.Range("K2").Value = "% Done"
    wsGantt.Range("L2").Value = "Status"
    wsGantt.Range("M2").Value = "Priority"
    
    With wsGantt.Range("A2:M2")
        .Font.Bold = True
        .Interior.Color = RGB(52, 73, 94)
        .Font.Color = RGB(255, 255, 255)
        .HorizontalAlignment = xlCenter
    End With
    
    ' Column widths
    wsGantt.Columns("A").ColumnWidth = 4
    wsGantt.Columns("B").ColumnWidth = 25
    wsGantt.Columns("C").ColumnWidth = 18
    wsGantt.Columns("D").ColumnWidth = 8
    wsGantt.Columns("E").ColumnWidth = 11
    wsGantt.Columns("F").ColumnWidth = 11
    wsGantt.Columns("G").ColumnWidth = 5
    wsGantt.Columns("H").ColumnWidth = 7
    wsGantt.Columns("I").ColumnWidth = 8
    wsGantt.Columns("J").ColumnWidth = 8
    wsGantt.Columns("K").ColumnWidth = 6
    wsGantt.Columns("L").ColumnWidth = 11
    wsGantt.Columns("M").ColumnWidth = 8
    
    ' Timeline setup
    projectStart = Date
    numDays = 120
    startDateCol = 14
    prevMonth = -1
    monthStartCol = startDateCol
    
    ' Create date headers with month labels
    For i = 0 To numDays - 1
        currentMonth = Month(projectStart + i)
        
        ' Day number in row 2
        wsGantt.Cells(2, startDateCol + i).Value = projectStart + i
        wsGantt.Cells(2, startDateCol + i).NumberFormat = "dd"
        wsGantt.Columns(startDateCol + i).ColumnWidth = 2.5
        
        ' Month label in row 1
        If currentMonth <> prevMonth Then
            If prevMonth <> -1 Then
                wsGantt.Range(wsGantt.Cells(1, monthStartCol), wsGantt.Cells(1, startDateCol + i - 1)).Merge
            End If
            monthStartCol = startDateCol + i
            wsGantt.Cells(1, startDateCol + i).Value = Format(projectStart + i, "MMM YYYY")
            prevMonth = currentMonth
        End If
        
        ' Weekend highlighting
        If Weekday(projectStart + i) = 1 Or Weekday(projectStart + i) = 7 Then
            wsGantt.Cells(2, startDateCol + i).Interior.Color = RGB(200, 200, 200)
        Else
            wsGantt.Cells(2, startDateCol + i).Interior.Color = RGB(52, 73, 94)
            wsGantt.Cells(2, startDateCol + i).Font.Color = RGB(255, 255, 255)
        End If
    Next i
    
    ' Merge last month
    wsGantt.Range(wsGantt.Cells(1, monthStartCol), wsGantt.Cells(1, startDateCol + numDays - 1)).Merge
    
    ' Format month headers
    With wsGantt.Range(wsGantt.Cells(1, startDateCol), wsGantt.Cells(1, startDateCol + numDays - 1))
        .Font.Bold = True
        .Interior.Color = RGB(33, 37, 41)
        .Font.Color = RGB(255, 255, 255)
        .HorizontalAlignment = xlCenter
    End With
    
    wsGantt.Rows(1).RowHeight = 22
    wsGantt.Rows(2).RowHeight = 18
    
    ' Task rows (3 to 52 = 50 tasks)
    For i = 3 To 52
        wsGantt.Cells(i, 1).Value = i - 2
        wsGantt.Cells(i, 7).Formula = "=IF(AND(E" & i & "<>"""",F" & i & "<>""""),F" & i & "-E" & i & "+1,"""")"
        wsGantt.Cells(i, 10).Formula = "=IF(AND(H" & i & "<>"""",I" & i & "<>""""),H" & i & "-I" & i & ","""")"
        wsGantt.Cells(i, 11).Formula = "=IF(AND(H" & i & "<>"""",I" & i & "<>""""),ROUND(I" & i & "/H" & i & ",2),"""")"
        wsGantt.Cells(i, 4).Formula = "=IFERROR(VLOOKUP(C" & i & ",'Team Members'!A:B,2,FALSE),"""")"
    Next i
    
    ' Data validation - Assigned To
    With wsGantt.Range("C3:C52").Validation
        .Delete
        .Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, Formula1:="='Team Members'!$A$2:$A$15"
    End With
    
    ' Data validation - Status
    With wsGantt.Range("L3:L52").Validation
        .Delete
        .Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, Formula1:="Not Started,In Progress,Complete,On Hold,Delayed"
    End With
    
    ' Data validation - Priority
    With wsGantt.Range("M3:M52").Validation
        .Delete
        .Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, Formula1:="Low,Medium,High,Critical"
    End With
    
    ' Freeze panes
    wsGantt.Activate
    ActiveWindow.FreezePanes = False
    wsGantt.Range("N3").Select
    ActiveWindow.FreezePanes = True
End Sub

Public Sub CreateDashboard()
    Dim wsDash As Worksheet
    Dim i As Integer
    
    On Error Resume Next
    Set wsDash = ThisWorkbook.Sheets("Dashboard")
    On Error GoTo 0
    
    If wsDash Is Nothing Then
        Set wsDash = ThisWorkbook.Sheets.Add(Before:=ThisWorkbook.Sheets(1))
        wsDash.Name = "Dashboard"
    End If
    
    wsDash.Cells.Clear
    
    wsDash.Range("A1").Value = "PROJECT DASHBOARD"
    wsDash.Range("A1").Font.Size = 20
    wsDash.Range("A1").Font.Bold = True
    
    wsDash.Range("A3").Value = "Total Tasks:"
    wsDash.Range("B3").Formula = "=COUNTA('Gantt Chart'!B3:B52)"
    
    wsDash.Range("A4").Value = "Completed:"
    wsDash.Range("B4").Formula = "=COUNTIF('Gantt Chart'!L3:L52,""Complete"")"
    
    wsDash.Range("A5").Value = "In Progress:"
    wsDash.Range("B5").Formula = "=COUNTIF('Gantt Chart'!L3:L52,""In Progress"")"
    
    wsDash.Range("A6").Value = "Not Started:"
    wsDash.Range("B6").Formula = "=COUNTIF('Gantt Chart'!L3:L52,""Not Started"")"
    
    wsDash.Range("A8").Value = "Total Est Hours:"
    wsDash.Range("B8").Formula = "=SUM('Gantt Chart'!H3:H52)"
    
    wsDash.Range("A9").Value = "Total Actual Hours:"
    wsDash.Range("B9").Formula = "=SUM('Gantt Chart'!I3:I52)"
    
    ' Team workload
    wsDash.Range("D3").Value = "TEAM WORKLOAD"
    wsDash.Range("D3").Font.Bold = True
    
    wsDash.Range("D4:G4").Value = Array("Name", "Target", "Assigned", "Variance")
    wsDash.Range("D4:G4").Font.Bold = True
    
    For i = 1 To 14
        wsDash.Cells(4 + i, 4).Formula = "='Team Members'!A" & (i + 1)
        wsDash.Cells(4 + i, 5).Formula = "='Team Members'!E" & (i + 1)
        wsDash.Cells(4 + i, 6).Formula = "='Team Members'!F" & (i + 1)
        wsDash.Cells(4 + i, 7).Formula = "=E" & (4 + i) & "-F" & (4 + i)
    Next i
    
    wsDash.Columns("A:G").AutoFit
End Sub

Public Sub RefreshGanttChart()
    Application.EnableEvents = False
    Application.ScreenUpdating = False
    
    Call ApplyGanttBars
    Call ColorByMember
    Call ColorStatus
    Call ColorPriority
    
    Application.ScreenUpdating = True
    Application.EnableEvents = True
    
    MsgBox "Gantt Chart refreshed!", vbInformation
End Sub

Public Sub ApplyGanttBars()
    Dim wsGantt As Worksheet
    Dim i As Integer
    Dim j As Integer
    Dim startDateCol As Integer
    Dim numDays As Integer
    Dim colLetter As String
    Dim cell As Range
    
    Set wsGantt = ThisWorkbook.Sheets("Gantt Chart")
    startDateCol = 14
    numDays = 120
    
    ' Clear Gantt area
    wsGantt.Range(wsGantt.Cells(3, startDateCol), wsGantt.Cells(52, startDateCol + numDays - 1)).Interior.ColorIndex = xlNone
    
    ' Apply formulas for bars
    For i = 3 To 52
        For j = 0 To numDays - 1
            Set cell = wsGantt.Cells(i, startDateCol + j)
            colLetter = Split(wsGantt.Cells(2, startDateCol + j).Address, "$")(1)
            cell.Formula = "=IF(AND($E" & i & "<>"""",$F" & i & "<>""""," & colLetter & "$2>=$E" & i & "," & colLetter & "$2<=$F" & i & "),1,"""")"
            cell.NumberFormat = ";;;"
        Next j
    Next i
End Sub

Public Sub ColorByMember()
    Dim wsGantt As Worksheet
    Dim wsTeam As Worksheet
    Dim i As Integer
    Dim j As Integer
    Dim k As Integer
    Dim startDateCol As Integer
    Dim numDays As Integer
    Dim memberName As String
    Dim memberColor As Long
    
    Set wsGantt = ThisWorkbook.Sheets("Gantt Chart")
    Set wsTeam = ThisWorkbook.Sheets("Team Members")
    startDateCol = 14
    numDays = 120
    
    For i = 3 To 52
        memberName = wsGantt.Cells(i, 3).Value
        memberColor = RGB(52, 152, 219) ' Default blue
        
        If memberName <> "" Then
            For k = 2 To 15
                If wsTeam.Cells(k, 1).Value = memberName Then
                    memberColor = wsTeam.Cells(k, 3).Interior.Color
                    Exit For
                End If
            Next k
        End If
        
        For j = 0 To numDays - 1
            If wsGantt.Cells(i, startDateCol + j).Value = 1 Then
                wsGantt.Cells(i, startDateCol + j).Interior.Color = memberColor
            End If
        Next j
    Next i
End Sub

Public Sub ColorStatus()
    Dim wsGantt As Worksheet
    Dim i As Integer
    
    Set wsGantt = ThisWorkbook.Sheets("Gantt Chart")
    
    For i = 3 To 52
        Select Case wsGantt.Cells(i, 12).Value
            Case "Complete"
                wsGantt.Cells(i, 12).Interior.Color = RGB(40, 167, 69)
                wsGantt.Cells(i, 12).Font.Color = RGB(255, 255, 255)
            Case "In Progress"
                wsGantt.Cells(i, 12).Interior.Color = RGB(23, 162, 184)
                wsGantt.Cells(i, 12).Font.Color = RGB(255, 255, 255)
            Case "Not Started"
                wsGantt.Cells(i, 12).Interior.Color = RGB(108, 117, 125)
                wsGantt.Cells(i, 12).Font.Color = RGB(255, 255, 255)
            Case "Delayed"
                wsGantt.Cells(i, 12).Interior.Color = RGB(220, 53, 69)
                wsGantt.Cells(i, 12).Font.Color = RGB(255, 255, 255)
            Case Else
                wsGantt.Cells(i, 12).Interior.ColorIndex = xlNone
                wsGantt.Cells(i, 12).Font.Color = RGB(0, 0, 0)
        End Select
    Next i
End Sub

Public Sub ColorPriority()
    Dim wsGantt As Worksheet
    Dim i As Integer
    
    Set wsGantt = ThisWorkbook.Sheets("Gantt Chart")
    
    For i = 3 To 52
        Select Case wsGantt.Cells(i, 13).Value
            Case "Critical"
                wsGantt.Cells(i, 13).Interior.Color = RGB(220, 53, 69)
                wsGantt.Cells(i, 13).Font.Color = RGB(255, 255, 255)
            Case "High"
                wsGantt.Cells(i, 13).Interior.Color = RGB(255, 193, 7)
                wsGantt.Cells(i, 13).Font.Color = RGB(0, 0, 0)
            Case "Medium"
                wsGantt.Cells(i, 13).Interior.Color = RGB(23, 162, 184)
                wsGantt.Cells(i, 13).Font.Color = RGB(255, 255, 255)
            Case "Low"
                wsGantt.Cells(i, 13).Interior.Color = RGB(40, 167, 69)
                wsGantt.Cells(i, 13).Font.Color = RGB(255, 255, 255)
            Case Else
                wsGantt.Cells(i, 13).Interior.ColorIndex = xlNone
                wsGantt.Cells(i, 13).Font.Color = RGB(0, 0, 0)
        End Select
    Next i
End Sub

Public Sub ValidateGantt()
    Dim wsGantt As Worksheet
    Dim wsTeam As Worksheet
    Dim i As Integer
    Dim issues As String
    Dim count As Integer
    
    Set wsGantt = ThisWorkbook.Sheets("Gantt Chart")
    Set wsTeam = ThisWorkbook.Sheets("Team Members")
    
    issues = ""
    count = 0
    
    For i = 3 To 52
        If wsGantt.Cells(i, 2).Value <> "" Then
            ' Check hours > 16
            If wsGantt.Cells(i, 8).Value > 16 Then
                count = count + 1
                issues = issues & count & ". Task " & (i - 2) & " exceeds 16 hrs" & vbCrLf
            End If
            ' Check no assignment
            If wsGantt.Cells(i, 3).Value = "" Then
                count = count + 1
                issues = issues & count & ". Task " & (i - 2) & " has no assignment" & vbCrLf
            End If
        End If
    Next i
    
    ' Check team over target
    For i = 2 To 15
        If wsTeam.Cells(i, 6).Value > wsTeam.Cells(i, 5).Value Then
            count = count + 1
            issues = issues & count & ". " & wsTeam.Cells(i, 1).Value & " is over target hours" & vbCrLf
        End If
    Next i
    
    If count = 0 Then
        MsgBox "All validations passed!", vbInformation
    Else
        MsgBox "Issues found:" & vbCrLf & vbCrLf & issues, vbExclamation
    End If
End Sub

Public Sub ShowDatePicker(targetCell As Range)
    Dim inputDate As String
    inputDate = InputBox("Enter date (MM/DD/YYYY):", "Date Picker", Format(Date, "MM/DD/YYYY"))
    If inputDate <> "" Then
        If IsDate(inputDate) Then
            targetCell.Value = CDate(inputDate)
            targetCell.NumberFormat = "YYYY-MM-DD"
        End If
    End If
End Sub