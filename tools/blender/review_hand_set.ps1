[CmdletBinding()]
param([string]$BlenderExe)
& (Join-Path $PSScriptRoot 'review_component.ps1') -BlenderExe $BlenderExe -Generator (Join-Path $PSScriptRoot 'parametric_hand_v1.py') -ParamsFile (Join-Path $PSScriptRoot 'test_hand_set_v1.json') -AssetName 'hand-set-v1' -AssetLabel 'Dial Designer provisional hand-set v1'
exit $LASTEXITCODE
