try { taskkill /IM node.exe /F } catch { }
Write-Output 'killed_node'
$p80 = Test-NetConnection -ComputerName admin.cnsubscribe.xyz -Port 80 -InformationLevel Detailed
Write-Output ("PORT80: " + $p80.TcpTestSucceeded)
$p443 = Test-NetConnection -ComputerName admin.cnsubscribe.xyz -Port 443 -InformationLevel Detailed
Write-Output ("PORT443: " + $p443.TcpTestSucceeded)
$out = @()
foreach ($scheme in @('ws','wss')) {
  $uri = [Uri]::new("${scheme}://admin.cnsubscribe.xyz")
  try {
    $ws = [System.Net.WebSockets.ClientWebSocket]::new()
    $c = [Threading.CancellationTokenSource]::new(5000)
    $t = $ws.ConnectAsync($uri, $c.Token)
    $t.Wait(7000)
    $out += "$($uri.AbsoluteUri) CONNECTED: $($ws.State)"
    $ws.Dispose()
  } catch {
    $out += "$($uri.AbsoluteUri) ERROR: $($_.Exception.Message)"
  }
}
$out | ForEach-Object { Write-Output $_ }
