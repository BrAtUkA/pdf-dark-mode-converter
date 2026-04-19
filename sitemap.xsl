<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">

  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html lang="en">
    <head>
      <meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
      <title>Sitemap — PDF Dark Mode Converter</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#111;color:#ccc;padding:24px;max-width:960px;margin:0 auto}
        h1{color:#fff;font-size:1.5rem;margin-bottom:4px}
        p.meta{color:#888;font-size:.85rem;margin-bottom:20px}
        a{color:#6cf;text-decoration:none}
        a:hover{text-decoration:underline}
        table{width:100%;border-collapse:collapse;font-size:.875rem}
        thead{position:sticky;top:0}
        th{background:#1a1a1a;color:#aaa;text-align:left;padding:8px 10px;border-bottom:1px solid #333;font-weight:600;text-transform:uppercase;font-size:.75rem;letter-spacing:.04em}
        td{padding:7px 10px;border-bottom:1px solid #222}
        tr:hover td{background:#1a1a1a}
        .url{word-break:break-all}
        .langs{display:flex;flex-wrap:wrap;gap:4px}
        .lang-tag{background:#222;border:1px solid #333;border-radius:3px;padding:1px 5px;font-size:.7rem;color:#999;white-space:nowrap}
        .priority{text-align:center}
        .freq{text-align:center;text-transform:capitalize}
        @media(max-width:640px){th:nth-child(3),td:nth-child(3),th:nth-child(4),td:nth-child(4){display:none}}
      </style>
    </head>
    <body>
      <h1>&#x1F5FA; Sitemap</h1>
      <p class="meta">
        <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/> URLs ·
        <a href="https://bratuka.dev/pdf-dark-mode-converter/">PDF Dark Mode Converter</a>
      </p>
      <table>
        <thead>
          <tr>
            <th>URL</th>
            <th>Languages</th>
            <th class="priority">Priority</th>
            <th class="freq">Freq</th>
          </tr>
        </thead>
        <tbody>
          <xsl:for-each select="sitemap:urlset/sitemap:url">
            <xsl:sort select="sitemap:priority" order="descending"/>
            <tr>
              <td class="url">
                <a href="{sitemap:loc}">
                  <xsl:value-of select="substring-after(sitemap:loc, 'bratuka.dev')"/>
                </a>
              </td>
              <td>
                <div class="langs">
                  <xsl:for-each select="xhtml:link[@rel='alternate' and @hreflang != 'x-default']">
                    <span class="lang-tag"><xsl:value-of select="@hreflang"/></span>
                  </xsl:for-each>
                </div>
              </td>
              <td class="priority"><xsl:value-of select="sitemap:priority"/></td>
              <td class="freq"><xsl:value-of select="sitemap:changefreq"/></td>
            </tr>
          </xsl:for-each>
        </tbody>
      </table>
    </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
