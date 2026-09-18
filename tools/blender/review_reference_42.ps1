[CmdletBinding()]
param([string]$BlenderExe)
& (Join-Path $PSScriptRoot 'review_component.ps1') -BlenderExe $BlenderExe -Generator (Join-Path $PSScriptRoot 'reference_42_assembly.py') -ParamsFile (Join-Path $PSScriptRoot 'reference_42_assembly.json') -AssetName 'reference-42-assembly' -AssetLabel 'Dial Designer provisional case crown hand assembly'
exit $LASTEXITCODE
