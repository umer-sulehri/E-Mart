# Generate square PWA/app icons from the existing logo raster.
#
# Why this exists: public/manifest.json declared /images/logo.webp as both
# 192x192 and 512x512, but that file is a 241x54 landscape wordmark (4.5:1).
# Declaring a wide image as a square icon is what makes Chrome refuse to
# offer PWA install.
#
# The repo has no SVG rasterizer (no sharp, resvg or playwright; the
# convert.exe on PATH is the Windows FAT converter, not ImageMagick), so the
# square icons are rendered from the PNG wordmark in
# organic-1.0.0/images/logo.png. The mark glyph is the leftmost ~42px; the
# rest is the "E-Mart" lettering, which is unreadable at icon sizes.
Add-Type -AssemblyName System.Drawing

$src = 'organic-1.0.0\images\logo.png'
$out = 'public\icons'

if (-not (Test-Path $out)) { New-Item -ItemType Directory -Path $out | Out-Null }

$img = [System.Drawing.Image]::FromFile((Resolve-Path $src))
$bmp = New-Object System.Drawing.Bitmap $img

# Measured ink bbox of the mark glyph, from a column scan of non-transparent
# pixels: x 5..46, y 0..51.
$crop = New-Object System.Drawing.Rectangle 5, 0, 42, 52
$mark = $bmp.Clone($crop, $bmp.PixelFormat)

# Interpolation matters: the source is ~42x52 and these targets are up to 512.
# Without HighQualityBicubic the upscale aliases badly at small sizes.
$mode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$wrap = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

foreach ($size in 192, 512) {
  $canvas = New-Object System.Drawing.Bitmap $size, $size
  $canvas.SetResolution(96, 96)
  $g = [System.Drawing.Graphics]::FromImage($canvas)

  $g.Clear([System.Drawing.Color]::White)
  $g.InterpolationMode = $mode
  $g.PixelOffsetMode = $wrap
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

  # Maskable-safe inner box: ~62% of the canvas, well inside the 80% safe area
  # so platform masks (circle, squircle) never clip the artwork.
  $inner = [int]($size * 0.62)
  $scale = [Math]::Min($inner / $mark.Width, $inner / $mark.Height)
  $w = [int]($mark.Width * $scale)
  $h = [int]($mark.Height * $scale)
  $x = [int](($size - $w) / 2)
  $y = [int](($size - $h) / 2)

  $g.DrawImage($mark, $x, $y, $w, $h)
  $g.Dispose()

  $file = Join-Path $out "icon-$size.png"
  $canvas.Save($file, [System.Drawing.Imaging.ImageFormat]::Png)
  $canvas.Dispose()
  "wrote $file  (mark drawn ${w}x${h} at ${x},${y} in ${size}x${size})"
}

$mark.Dispose(); $bmp.Dispose(); $img.Dispose()

# apple-touch-icon. iOS does not render WebP here; it has always wanted PNG.
# 180x180 is what iOS consumes.
$canvas = New-Object System.Drawing.Bitmap 180, 180
$canvas.SetResolution(96, 96)
$g = [System.Drawing.Graphics]::FromImage($canvas)
$g.Clear([System.Drawing.Color]::White)
$g.InterpolationMode = $mode
$g.PixelOffsetMode = $wrap
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$img = [System.Drawing.Image]::FromFile((Resolve-Path $src))
$bmp = New-Object System.Drawing.Bitmap $img
$mark = $bmp.Clone($crop, $bmp.PixelFormat)
$inner = 112
$scale = [Math]::Min($inner / $mark.Width, $inner / $mark.Height)
$w = [int]($mark.Width * $scale); $h = [int]($mark.Height * $scale)
$g.DrawImage($mark, [int]((180 - $w) / 2), [int]((180 - $h) / 2), $w, $h)
$g.Dispose()
$apple = 'public\icons\apple-touch-icon.png'
$canvas.Save($apple, [System.Drawing.Imaging.ImageFormat]::Png)
$canvas.Dispose(); $mark.Dispose(); $bmp.Dispose(); $img.Dispose()
"wrote $apple"
