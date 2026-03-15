
# gen_data_js4.ps1
# 실행 위치: c:\MAX\ETHERGUARD_2
# 실행법: powershell -File gen_data_js4.ps1

Set-Location (Split-Path $MyInvocation.MyCommand.Path)

# 현재 디렉터리기준 CSV 파일들을 상대경로로 읽기
function ReadCsv($filename) {
    if (Test-Path ".\$filename") {
        $bytes = [System.IO.File]::ReadAllBytes("$(Get-Location)\$filename")
        # UTF-8 BOM (EF BB BF) 체크
        if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
            return [System.IO.File]::ReadAllText("$(Get-Location)\$filename", [System.Text.Encoding]::UTF8)
        }
        
        # BOM이 없는 경우: UTF-8로 먼저 읽어보고 한글 깨짐 여부 대략적 판단 (\uFFFD 패턴)
        $text = [System.IO.File]::ReadAllText("$(Get-Location)\$filename", [System.Text.Encoding]::UTF8)
        if ($text.Contains([char]0xFFFD)) { 
            return [System.IO.File]::ReadAllText("$(Get-Location)\$filename", [System.Text.Encoding]::GetEncoding(949))
        }
        return $text
    }
    Write-Warning "파일을 찾을 수 없습니다: $filename"
    return ""
}

$questRaw     = ReadCsv "quest_tb.csv"
$statRaw      = ReadCsv "stat_init_tb.csv"
$emotionRaw   = ReadCsv "emotion_tb.csv"
$sectorRaw    = ReadCsv "sector_tb.csv"
$stageRaw     = ReadCsv "stage_tb.csv"
$worldRaw     = ReadCsv "world_tb.csv"
$characterRaw = ReadCsv "character_tb.csv"

if ($null -ne $questRaw -and $questRaw -ne "") {
    Write-Host "quest rows: $($questRaw.Split("`n").Count)"
} else {
    Write-Warning "quest_tb.csv가 비어있거나 찾을 수 없습니다."
}

function EscapeJs($s) {
    if ($null -eq $s) { return "" }
    # JS 탬플릿 리터럴 내 이스케이프
    $s = $s -replace '\\', '\\\\'
    $s = $s -replace '`', '\`'
    return $s
}

$q  = EscapeJs $questRaw
$st = EscapeJs $statRaw
$em = EscapeJs $emotionRaw
$sc = EscapeJs $sectorRaw
$sg = EscapeJs $stageRaw
$w  = EscapeJs $worldRaw
$ch = EscapeJs $characterRaw

# 백틱 문자를 변수로 처리
$BT = [char]96

$content = @"
// data.js - Auto-generated $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

const csvData = ${BT}${q}${BT};

const statCsvData = ${BT}${st}${BT};

const emotionCsvData = ${BT}${em}${BT};

const sectorCsvData = ${BT}${sc}${BT};

const stageCsvData = ${BT}${sg}${BT};

const worldCsvData = ${BT}${w}${BT};

const characterCsvData = ${BT}${ch}${BT};
"@

# 결과 파일 저장 (prototype 폴더)
$outPath = ".\prototype\data.js"
$Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $False
[System.IO.File]::WriteAllLines($outPath, $content.Split("`n"), $Utf8NoBomEncoding)

$sz = (Get-Item $outPath).Length
Write-Host "완료! .\prototype\data.js ($sz bytes)"
