#!/usr/bin/env python3
import urllib.request, re, json, datetime, os
from PIL import Image

def fetch_contribution_data(username="Vishvas77"):
    url = f"https://github.com/users/{username}/contributions"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode("utf-8")
        
    tds = re.findall(r'<td[^>]*class="[^"]*ContributionCalendar-day[^"]*"[^>]*>', html)
    items = []
    for td in tds:
        date_m = re.search(r'data-date="([^"]+)"', td)
        level_m = re.search(r'data-level="([^"]+)"', td)
        id_m = re.search(r'id="([^"]+)"', td)
        if date_m and level_m:
            items.append({
                "date": date_m.group(1),
                "level": int(level_m.group(1)),
                "id": id_m.group(1) if id_m else None
            })
            
    tooltips = {}
    for tt_match in re.finditer(r'<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]+)</tool-tip>', html):
        tooltips[tt_match.group(1)] = tt_match.group(2).strip()
        
    days = []
    total_count = 0
    active_days = 0
    
    for item in items:
        tip = tooltips.get(item["id"], "")
        cnt_m = re.search(r'(\d+)\s+contribution', tip)
        cnt = int(cnt_m.group(1)) if cnt_m else 0
        
        # Calculate strict VISHVAS77 intensity tier from real count
        if cnt == 0:
            tier = 0
        elif cnt <= 2:
            tier = 1
        elif cnt <= 5:
            tier = 2
        elif cnt <= 9:
            tier = 3
        else:
            tier = 4
            
        total_count += cnt
        if cnt > 0:
            active_days += 1
            
        days.append({
            "date": item["date"],
            "count": cnt,
            "tier": tier,
            "tip": tip
        })
        
    return days, total_count, active_days

def generate_svg(days, total_count, active_days, output_path="assets/contributions.svg"):
    # SVG Constants
    svg_w = 850
    svg_h = 195
    grid_start_x = 42
    grid_start_y = 62
    cell_size = 11
    cell_gap = 3.5
    step = cell_size + cell_gap # 14.5
    
    # Palette definition
    colors = {
        0: {"fill": "#161B22", "stroke": "#21262D"},
        1: {"fill": "#4C0A15", "stroke": "#5E0D1B"}, # 1-2: Deep Ritual Maroon
        2: {"fill": "#8C1226", "stroke": "#A8162E"}, # 3-5: Rich Crimson
        3: {"fill": "#D71C37", "stroke": "#EB2848"}, # 6-9: Vivid Crimson
        4: {"fill": "#F2879B", "stroke": "#FFAAB8"}, # 10+: Rose Apex Highlight
    }
    
    # Organize days into columns (weeks)
    # Total days is typically 371 (53 weeks * 7 days)
    weeks = []
    current_week = []
    for d in days:
        current_week.append(d)
        if len(current_week) == 7:
            weeks.append(current_week)
            current_week = []
    if current_week:
        weeks.append(current_week)
        
    # Month positions
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    month_labels = []
    last_month = None
    
    for w_idx, week in enumerate(weeks):
        for d in week:
            dt = datetime.datetime.strptime(d["date"], "%Y-%m-%d")
            m_name = month_names[dt.month - 1]
            if m_name != last_month and dt.day <= 7:
                last_month = m_name
                month_labels.append((m_name, grid_start_x + w_idx * step))
                
    # Build SVG content
    svg_parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {svg_w} {svg_h}" width="100%" height="auto" role="img" aria-label="Vishvas77\'s annual contribution matrix: {total_count} total contributions across {active_days} active days">',
        f'  <title>VISHVAS77 — Annual Contribution Activity</title>',
        f'  <desc>Annual contribution matrix showing {total_count} verified contributions across 52 weeks in the VISHVAS77 visual system.</desc>',
        f'  <style>',
        f'    .bg {{ fill: #0D1117; stroke: #21262D; stroke-width: 1; rx: 6; }}',
        f'    .title {{ font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; font-size: 11.5px; font-weight: 700; fill: #E6EDF3; letter-spacing: 0.08em; }}',
        f'    .stats {{ font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; font-size: 11px; font-weight: 600; fill: #A57D87; letter-spacing: 0.05em; }}',
        f'    .label {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 9.5px; fill: #8B949E; }}',
        f'    .legend-text {{ font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; font-size: 9.5px; fill: #8B949E; letter-spacing: 0.04em; }}',
        f'    .hairline {{ stroke: #21262D; stroke-width: 1; }}',
        f'    .accent-node {{ fill: #DC143C; }}',
        f'  </style>',
        f'  <!-- Card Background -->',
        f'  <rect x="0.5" y="0.5" width="{svg_w - 1}" height="{svg_h - 1}" class="bg" />',
        f'  <!-- Architectural Corner Anchors -->',
        f'  <polygon points="6,1 1,6 1,1" class="accent-node" opacity="0.85" />',
        f'  <polygon points="{svg_w-6},1 {svg_w-1},6 {svg_w-1},1" class="accent-node" opacity="0.85" />',
        f'  <polygon points="1,{svg_h-6} 6,{svg_h-1} 1,{svg_h-1}" class="accent-node" opacity="0.85" />',
        f'  <polygon points="{svg_w-1},{svg_h-6} {svg_w-6},{svg_h-1} {svg_w-1},{svg_h-1}" class="accent-node" opacity="0.85" />',
        f'  <!-- Header Row -->',
        f'  <text x="20" y="25" class="title"><tspan fill="#DC143C">◆</tspan> DOMAIN ACTIVITY // 2025–2026</text>',
        f'  <text x="{svg_w - 20}" y="25" text-anchor="end" class="stats">{total_count} DISPATCHES · {active_days} ACTIVE DAYS</text>',
        f'  <line x1="20" y1="36" x2="{svg_w - 20}" y2="36" class="hairline" />',
        f'  <!-- Month Headers -->',
    ]
    
    for m_name, m_x in month_labels:
        svg_parts.append(f'  <text x="{m_x:.1f}" y="52" class="label">{m_name}</text>')
        
    svg_parts.append('  <!-- Day Labels (Mon, Wed, Fri) -->')
    day_labels = [("Mon", 1), ("Wed", 3), ("Fri", 5)]
    for d_name, d_row in day_labels:
        d_y = grid_start_y + d_row * step + cell_size - 2
        svg_parts.append(f'  <text x="16" y="{d_y:.1f}" class="label">{d_name}</text>')
        
    svg_parts.append('  <!-- 52-Week Contribution Matrix -->')
    for w_idx, week in enumerate(weeks):
        for d_idx, day in enumerate(week):
            c_x = grid_start_x + w_idx * step
            c_y = grid_start_y + d_idx * step
            c_info = colors[day["tier"]]
            tip_esc = day["tip"].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            svg_parts.append(f'  <rect x="{c_x:.1f}" y="{c_y:.1f}" width="{cell_size}" height="{cell_size}" rx="2" ry="2" fill="{c_info["fill"]}" stroke="{c_info["stroke"]}" stroke-width="1"><title>{tip_esc}</title></rect>')
            
    # Legend Row
    legend_y = grid_start_y + 7 * step + 18
    svg_parts.extend([
        f'  <!-- Bottom Legend & Telemetry -->',
        f'  <line x1="20" y1="{legend_y - 10}" x2="{svg_w - 20}" y2="{legend_y - 10}" class="hairline" />',
        f'  <text x="20" y="{legend_y + 8}" class="legend-text">INTENSITY</text>',
        f'  <text x="85" y="{legend_y + 8}" class="legend-text" fill="#6E7681">LESS</text>',
    ])
    
    legend_x = 118
    for t_idx in range(5):
        c_info = colors[t_idx]
        svg_parts.append(f'  <rect x="{legend_x + t_idx * 16}" y="{legend_y - 1}" width="11" height="11" rx="2" ry="2" fill="{c_info["fill"]}" stroke="{c_info["stroke"]}" stroke-width="1" />')
        
    svg_parts.extend([
        f'  <text x="{legend_x + 5 * 16 + 8}" y="{legend_y + 8}" class="legend-text" fill="#6E7681">MORE</text>',
        f'  <text x="{svg_w - 20}" y="{legend_y + 8}" text-anchor="end" class="legend-text" fill="#8B949E">VERIFIED GITHUB GRAPHQL TELEMETRY</text>',
        f'</svg>'
    ])
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(svg_parts))
        
    sz_kb = os.path.getsize(output_path) / 1024
    print(f"Generated {output_path} ({sz_kb:.1f} KB) with {total_count} total contributions across {active_days} active days.")
    return output_path, sz_kb

if __name__ == "__main__":
    days, total, active = fetch_contribution_data("Vishvas77")
    generate_svg(days, total, active, "assets/contributions.svg")
