!macro customInit
  nsExec::Exec 'taskkill /F /IM HyperNova.exe /IM nova-helper.exe /T'
!macroend

!macro customInstall
  nsExec::Exec 'icacls "$INSTDIR" /grant *S-1-15-2-1:(OI)(CI)(RX) /T /C /Q'
!macroend

!macro customFinishPage
  !ifndef HIDE_RUN_AFTER_FINISH
    Function StartApp
      ; Launch non-blockingly via Explorer to prevent COM/UAC shell hang on Finish
      Exec '"$WINDIR\explorer.exe" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"'
    FunctionEnd

    !define MUI_FINISHPAGE_RUN
    !define MUI_FINISHPAGE_RUN_FUNCTION "StartApp"
  !endif
  !insertmacro MUI_PAGE_FINISH
!macroend
