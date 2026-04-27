from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SOURCE = ASSETS / "estes.webp"
OUTPUT = ASSETS / "stream-scene-sunset.png"


def build_plate():
    image = Image.open(SOURCE).convert("RGBA").resize((1024, 1024), Image.LANCZOS)
    image = ImageEnhance.Color(image).enhance(0.9)
    image = ImageEnhance.Contrast(image).enhance(0.98)
    image = ImageEnhance.Brightness(image).enhance(0.9)

    warmth = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(warmth)
    draw.ellipse((-160, -180, 520, 500), fill=(255, 197, 129, 88))
    draw.ellipse((60, 440, 760, 980), fill=(226, 119, 72, 30))
    warmth = warmth.filter(ImageFilter.GaussianBlur(76))
    image = Image.alpha_composite(image, warmth)

    beam = Image.new("L", image.size, 0)
    beam_draw = ImageDraw.Draw(beam)
    beam_draw.polygon([(0, 0), (478, 0), (612, 668), (0, 1024)], fill=164)
    beam = beam.filter(ImageFilter.GaussianBlur(38))
    beam_layer = Image.new("RGBA", image.size, (255, 220, 170, 0))
    beam_layer.putalpha(beam)
    image = Image.alpha_composite(image, beam_layer)

    shade = Image.new("RGBA", image.size, (20, 24, 21, 42))
    shade_mask = Image.linear_gradient("L").resize(image.size).transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    shade.putalpha(shade_mask.point(lambda value: int(value * 0.42)))
    image = Image.alpha_composite(image, shade)

    vignette = Image.new("L", image.size, 0)
    vignette_draw = ImageDraw.Draw(vignette)
    vignette_draw.ellipse((-120, -80, 1144, 1120), fill=188)
    vignette = ImageChops.invert(vignette).filter(ImageFilter.GaussianBlur(72))
    vignette_layer = Image.new("RGBA", image.size, (10, 10, 8, 0))
    vignette_layer.putalpha(vignette)
    image = Image.alpha_composite(image, vignette_layer)

    image.save(OUTPUT)


if __name__ == "__main__":
    build_plate()
