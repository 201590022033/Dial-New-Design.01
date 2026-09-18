[CmdletBinding()]
param([string]$BlenderExe)
& (Join-Path $PSScriptRoot 'review_component.ps1') -BlenderExe $BlenderExe -Generator (Join-Path $PSScriptRoot 'parametric_crown_v1.py') -ParamsFile (Join-Path $PSScriptRoot 'test_crown_v1.json') -AssetName 'crown-v1' -AssetLabel 'Dial Designer provisional crown v1'
exit $LASTEXITCODE
