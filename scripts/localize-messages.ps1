param([string[]]$Locales)

$ErrorActionPreference = 'Stop'
$sourcePath = Join-Path $PSScriptRoot '..\messages\en.json'
$source = Get-Content -Raw -Encoding UTF8 $sourcePath | ConvertFrom-Json
$targets = [ordered]@{
  'ko' = 'ko'; 'ja' = 'ja'; 'es' = 'es'; 'de' = 'de'; 'fr' = 'fr'; 'ru' = 'ru'
  'ar' = 'ar'; 'pt' = 'pt'; 'it' = 'it'; 'zh-TW' = 'zh-TW'; 'tr' = 'tr'
  'vi' = 'vi'; 'nl' = 'nl'; 'th' = 'th'; 'pl' = 'pl'; 'hu' = 'hu'
}
if (-not $Locales -or $Locales.Count -eq 0) { $Locales = @($targets.Keys) }

$protectedPattern = '\{[^{}]+\}|https?://\S+|AI Image\.0|AI Image|FLUX.2 [pro]|FLUX.2 [pro]|MiniMax H3|Seedance 2\.5|WAN 3\.0|ComfyUI|GitHub|Google|Cloudflare|Stripe|PayPal|Creem|Alipay|WeChat|Replicate|Gemini|OAuth|SMTP|JSON|REST API|API|S3|R2|D1'
$items = [System.Collections.Generic.List[object]]::new()
foreach ($property in $source.PSObject.Properties) {
  if ($property.Name -eq '$schema') { continue }
  $values = [System.Collections.Generic.List[string]]::new()
  $masked = [regex]::Replace([string]$property.Value, $protectedPattern, {
    param($match)
    $token = "ZXQPH$($values.Count)QXZ"
    $values.Add($match.Value)
    return $token
  }, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
  $items.Add([pscustomobject]@{ Key = $property.Name; Masked = $masked; Values = $values })
}

function Invoke-TranslationBatch {
  param([object[]]$Batch, [string]$Target)
  $parts = [System.Collections.Generic.List[string]]::new()
  for ($i = 0; $i -lt $Batch.Count; $i++) {
    $parts.Add("[[[APPMSG$($i.ToString('0000'))]]]`n$($Batch[$i].Masked)")
  }
  $body = @{ client = 'gtx'; sl = 'en'; tl = $Target; dt = 't'; q = ($parts -join "`n") }
  for ($attempt = 1; $attempt -le 5; $attempt++) {
    try {
      $payload = Invoke-RestMethod -Method Post -Uri 'https://translate.googleapis.com/translate_a/single' -Body $body -TimeoutSec 60
      $translatedParts = @($payload[0] | ForEach-Object { [string]$_[0] })
      $translated = $translatedParts -join ''
      $split = @([regex]::Split($translated, '\s*\[\[\[APPMSG\d{4}\]\]\]\s*'))
      $values = @($split | Select-Object -Skip 1)
      if ($values.Count -ne $Batch.Count) { throw "Expected $($Batch.Count) entries, received $($values.Count)" }
      return $values
    } catch {
      if ($attempt -eq 5) { throw }
      Start-Sleep -Seconds ($attempt * 2)
    }
  }
}

foreach ($locale in $Locales) {
  if (-not $targets.Contains($locale)) { throw "Unsupported locale: $locale" }
  $outputPath = Join-Path $PSScriptRoot "..\messages\$locale.json"
  $output = [ordered]@{ '$schema' = $source.'$schema' }
  if (Test-Path $outputPath) {
    $checkpoint = Get-Content -Raw -Encoding UTF8 $outputPath | ConvertFrom-Json
    foreach ($property in $checkpoint.PSObject.Properties) {
      $output[$property.Name] = $property.Value
    }
  }
  $remainingItems = @($items | Where-Object { -not $output.Contains($_.Key) })
  $batches = [System.Collections.Generic.List[object]]::new()
  $batch = [System.Collections.Generic.List[object]]::new()
  $length = 0
  foreach ($item in $remainingItems) {
    $addition = $item.Masked.Length + 28
    if ($batch.Count -gt 0 -and ($length + $addition) -gt 8000) {
      $batches.Add($batch.ToArray()); $batch = [System.Collections.Generic.List[object]]::new(); $length = 0
    }
    $batch.Add($item); $length += $addition
  }
  if ($batch.Count -gt 0) { $batches.Add($batch.ToArray()) }

  $completed = $items.Count - $remainingItems.Count
  foreach ($currentBatch in $batches) {
    $translations = Invoke-TranslationBatch -Batch $currentBatch -Target $targets[$locale]
    for ($i = 0; $i -lt $currentBatch.Count; $i++) {
      $value = [string]$translations[$i]
      for ($p = 0; $p -lt $currentBatch[$i].Values.Count; $p++) {
        $token = "ZXQPH${p}QXZ"
        $value = $value.Replace($token, $currentBatch[$i].Values[$p]).Replace($token.ToLowerInvariant(), $currentBatch[$i].Values[$p])
      }
      $output[$currentBatch[$i].Key] = $value.Trim()
    }
    $completed += $currentBatch.Count
    $checkpointJson = $output | ConvertTo-Json -Depth 5
    [System.IO.File]::WriteAllText($outputPath, "$checkpointJson`n", [System.Text.UTF8Encoding]::new($false))
    Write-Output "$locale $completed/$($items.Count)"
    # Keep the unofficial endpoint below its automated-traffic threshold.
    Start-Sleep -Milliseconds 1500
  }
  $json = $output | ConvertTo-Json -Depth 5
  [System.IO.File]::WriteAllText($outputPath, "$json`n", [System.Text.UTF8Encoding]::new($false))
  Write-Output "$locale done"
}
