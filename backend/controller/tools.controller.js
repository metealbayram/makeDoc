import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const cleanupFile = (filePath) => {
  if (!filePath) {
    return;
  }

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Failed to cleanup temporary file:", error);
  }
};

const convertWordToPdfWithPowerShell = (inputPath, outputPath) =>
  new Promise((resolve, reject) => {
    const powerShellScript = `
$ErrorActionPreference = 'Stop'
$inputPath = $env:INPUT_PATH
$outputPath = $env:OUTPUT_PATH

if (-not (Test-Path -LiteralPath $inputPath)) {
  throw 'Input file not found.'
}

$word = $null
$document = $null

try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0
  $document = $word.Documents.Open($inputPath, $false, $true)
  $document.ExportAsFixedFormat($outputPath, 17)
}
finally {
  if ($document -ne $null) {
    $document.Close([ref]$false)
    [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($document)
  }

  if ($word -ne $null) {
    $word.Quit()
    [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($word)
  }

  [System.GC]::Collect()
  [System.GC]::WaitForPendingFinalizers()
}
`;

    const child = spawn(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        powerShellScript,
      ],
      {
        windowsHide: true,
        env: {
          ...process.env,
          INPUT_PATH: inputPath,
          OUTPUT_PATH: outputPath,
        },
      },
    );

    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr.trim() || "Word to PDF conversion failed."));
    });
  });

export const convertWordToPdf = async (req, res) => {
  const inputPath = req.file?.path;
  let outputPath;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "A .doc or .docx file is required." });
    }

    if (process.platform !== "win32") {
      return res.status(400).json({
        message: "Word to PDF conversion is only available on the Windows server setup.",
      });
    }

    const outputDir = path.join(process.cwd(), "uploads", "tools", "converted");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const baseName = path.parse(req.file.originalname).name.replace(/[^a-z0-9_-]/gi, "_");
    outputPath = path.join(outputDir, `${Date.now()}-${baseName}.pdf`);

    await convertWordToPdfWithPowerShell(inputPath, outputPath);

    if (!fs.existsSync(outputPath)) {
      throw new Error("PDF file could not be created.");
    }

    res.download(outputPath, `${baseName || "converted-document"}.pdf`, () => {
      cleanupFile(inputPath);
      cleanupFile(outputPath);
    });
  } catch (error) {
    cleanupFile(inputPath);
    cleanupFile(outputPath);

    const message =
      error.message?.includes("Word.Application") ||
      error.message?.includes("ActiveX component")
        ? "Microsoft Word could not be started on the server. Make sure Word is installed."
        : error.message || "Word to PDF conversion failed.";

    res.status(500).json({ success: false, message });
  }
};
