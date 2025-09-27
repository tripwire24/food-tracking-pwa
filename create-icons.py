#!/usr/bin/env python3
"""
Simple script to create basic PWA icons using pillow
Run: pip install Pillow (if not already installed)
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os
    
    def create_icon(size, filename):
        # Create a green circle icon
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Draw green circle
        padding = size // 10
        draw.ellipse([padding, padding, size-padding, size-padding], 
                    fill='#2E7D32', outline='#1B5E20', width=2)
        
        # Add emoji-like food icon
        center = size // 2
        if size >= 96:  # Only add details for larger icons
            # Draw fork and knife (simplified)
            draw.rectangle([center-size//8, center-size//6, center-size//10, center+size//6], fill='white')
            draw.rectangle([center+size//10, center-size//6, center+size//8, center+size//6], fill='white')
            
            # Add a simple plate
            draw.ellipse([center-size//4, center, center+size//4, center+size//8], 
                        fill='white', outline='#E0E0E0', width=1)
        
        img.save(f'public/icons/{filename}')
        print(f"Created {filename} ({size}x{size})")
    
    # Create all required icon sizes
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    for size in sizes:
        create_icon(size, f'icon-{size}x{size}.png')
    
    # Create apple touch icon
    create_icon(180, 'apple-touch-icon.png')
    
    # Create favicon sizes
    create_icon(32, 'favicon-32x32.png')
    create_icon(16, 'favicon-16x16.png')
    
    print("\n✅ All PWA icons created successfully!")
    print("📱 Icons are now available for PWA installation")
    
except ImportError:
    print("⚠️  Pillow not installed. Creating placeholder icons...")
    
    # Create simple HTML-based icons as fallback
    svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}">
        <circle cx="{center}" cy="{center}" r="{radius}" fill="#2E7D32"/>
        <text x="{center}" y="{center}" text-anchor="middle" dy="0.35em" 
              font-family="Arial" font-size="{font_size}" fill="white">🍽️</text>
    </svg>'''
    
    sizes = [72, 96, 128, 144, 152, 192, 384, 512, 180, 32, 16]
    for size in sizes:
        center = size // 2
        radius = center - 4
        font_size = max(size // 4, 12)
        
        content = svg_content.format(
            size=size, center=center, radius=radius, font_size=font_size
        )
        
        if size == 180:
            filename = 'apple-touch-icon.svg'
        elif size == 32:
            filename = 'favicon-32x32.svg'
        elif size == 16:
            filename = 'favicon-16x16.svg'
        else:
            filename = f'icon-{size}x{size}.svg'
        
        with open(f'public/icons/{filename}', 'w') as f:
            f.write(content)
        
        print(f"Created {filename} ({size}x{size})")
    
    print("\n✅ SVG icons created as fallback!")
    print("📦 Install Pillow for better PNG icons: pip install Pillow")