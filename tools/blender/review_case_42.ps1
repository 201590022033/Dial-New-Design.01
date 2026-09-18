[CmdletBinding()]
param([string]$BlenderExe)
& (Join-Path $PSScriptRoot 'review_component.ps1') -BlenderExe $BlenderExe -Generator (Join-Path $PSScriptRoot 'parametric_case_v1.py') -ParamsFile (Join-Path $PSScriptRoot 'test_case_42.json') -AssetName 'case-42' -AssetLabel 'Dial Designer 42 mm test case'
exit $LASTEXITCODE
