export interface LicenseData {
  songTitle: string
  userName: string
  userEmail: string
  fileSize: string
  purchaseDate: Date
  licenseId: string
  songDuration: string
  genre: string
  format: string
}

export class LicenseGenerator {
  static generateLicenseId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 9)
    return `BB-${timestamp}-${random}`.toUpperCase()
  }

  static generateLicenseDocument(data: LicenseData): string {
    const formattedDate = data.purchaseDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Burnt Beats Commercial License - ${data.songTitle}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
            color: #333;
        }
        .license-container {
            background: white;
            padding: 60px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border: 3px solid #2d5a27;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #2d5a27;
            padding-bottom: 30px;
        }
        .watermark {
            width: 120px;
            height: 120px;
            margin: 0 auto 20px;
            opacity: 0.9;
        }
        .title {
            font-size: 32px;
            font-weight: bold;
            color: #2d5a27;
            margin: 20px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .subtitle {
            font-size: 18px;
            color: #666;
            margin-bottom: 10px;
        }
        .license-id {
            font-size: 14px;
            color: #999;
            font-family: 'Courier New', monospace;
            background: #f8f8f8;
            padding: 8px 15px;
            border-radius: 5px;
            display: inline-block;
            margin-top: 10px;
        }
        .metadata {
            background: #f9f9f9;
            padding: 25px;
            border-radius: 10px;
            margin: 30px 0;
            border-left: 5px solid #ff6b35;
        }
        .metadata-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .metadata-label {
            font-weight: bold;
            color: #2d5a27;
            min-width: 150px;
        }
        .metadata-value {
            color: #333;
            text-align: right;
        }
        .license-text {
            line-height: 1.8;
            margin: 30px 0;
            text-align: justify;
        }
        .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #2d5a27;
            margin: 30px 0 15px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .rights-list {
            list-style: none;
            padding: 0;
        }
        .rights-list li {
            padding: 8px 0;
            padding-left: 25px;
            position: relative;
        }
        .rights-list li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #2d5a27;
            font-weight: bold;
            font-size: 16px;
        }
        .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 30px;
            border-top: 2px solid #2d5a27;
            color: #666;
            font-size: 14px;
        }
        .signature-section {
            margin: 40px 0;
            display: flex;
            justify-content: space-between;
        }
        .signature-box {
            width: 45%;
            text-align: center;
            border-top: 2px solid #333;
            padding-top: 10px;
        }
        @media print {
            body { background: white; }
            .license-container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="license-container">
        <div class="header">
            <img src="/logos/burnt-beats-watermark.png" alt="Burnt Beats Watermark" class="watermark">
            <div class="title">Commercial Music License</div>
            <div class="subtitle">Full Commercial Rights & Ownership</div>
            <div class="license-id">License ID: ${data.licenseId}</div>
        </div>

        <div class="metadata">
            <div class="metadata-row">
                <span class="metadata-label">Song Title:</span>
                <span class="metadata-value">${data.songTitle}</span>
            </div>
            <div class="metadata-row">
                <span class="metadata-label">Licensee Name:</span>
                <span class="metadata-value">${data.userName}</span>
            </div>
            <div class="metadata-row">
                <span class="metadata-label">Email Address:</span>
                <span class="metadata-value">${data.userEmail}</span>
            </div>
            <div class="metadata-row">
                <span class="metadata-label">Purchase Date:</span>
                <span class="metadata-value">${formattedDate}</span>
            </div>
            <div class="metadata-row">
                <span class="metadata-label">File Size:</span>
                <span class="metadata-value">${data.fileSize}</span>
            </div>
            <div class="metadata-row">
                <span class="metadata-label">Duration:</span>
                <span class="metadata-value">${data.songDuration}</span>
            </div>
            <div class="metadata-row">
                <span class="metadata-label">Genre:</span>
                <span class="metadata-value">${data.genre}</span>
            </div>
            <div class="metadata-row">
                <span class="metadata-label">Format:</span>
                <span class="metadata-value">${data.format}</span>
            </div>
        </div>

        <div class="section-title">License Grant</div>
        <div class="license-text">
            This Commercial Music License grants <strong>${data.userName}</strong> ("Licensee") complete ownership and unlimited commercial rights to the musical composition titled "<strong>${data.songTitle}</strong>" ("The Work") generated by Burnt Beats AI music generation platform.
        </div>

        <div class="section-title">Rights Granted</div>
        <ul class="rights-list">
            <li><strong>100% Ownership:</strong> You own this track completely with no ongoing obligations to Burnt Beats</li>
            <li><strong>Commercial Use:</strong> Sell, distribute, and monetize without restrictions or royalty payments</li>
            <li><strong>Broadcasting Rights:</strong> Use in radio, TV, streaming platforms, and all media</li>
            <li><strong>Synchronization Rights:</strong> Use in videos, films, advertisements, and multimedia projects</li>
            <li><strong>Performance Rights:</strong> Perform live, record covers, and create derivative works</li>
            <li><strong>Distribution Rights:</strong> Upload to Spotify, Apple Music, YouTube, and all platforms</li>
            <li><strong>Modification Rights:</strong> Edit, remix, and create new versions</li>
            <li><strong>Exclusive Rights:</strong> This exact track will not be sold to other users</li>
        </ul>

        <div class="section-title">Terms & Conditions</div>
        <div class="license-text">
            <strong>1. Ownership Transfer:</strong> Upon payment of the license fee, all rights, title, and interest in The Work transfer completely to the Licensee.<br><br>
            
            <strong>2. No Attribution Required:</strong> You are not required to credit Burnt Beats in any use of The Work.<br><br>
            
            <strong>3. Unlimited Usage:</strong> There are no restrictions on the number of copies, distributions, or commercial uses.<br><br>
            
            <strong>4. Perpetual License:</strong> This license is valid forever with no expiration date.<br><br>
            
            <strong>5. Warranty:</strong> Burnt Beats warrants that The Work is original and does not infringe on any third-party rights.<br><br>
            
            <strong>6. Liability:</strong> Burnt Beats' liability is limited to the purchase price of this license.
        </div>

        <div class="signature-section">
            <div class="signature-box">
                <strong>Burnt Beats LLC</strong><br>
                AI Music Generation Platform<br>
                Date: ${formattedDate}
            </div>
            <div class="signature-box">
                <strong>${data.userName}</strong><br>
                Licensee<br>
                Date: ${formattedDate}
            </div>
        </div>

        <div class="footer">
            <strong>This license is legally binding and enforceable.</strong><br>
            For questions, contact: support@burntbeats.com<br>
            License verification: burntbeats.com/verify/${data.licenseId}
        </div>
    </div>
</body>
</html>
    `.trim()
  }

  static async generatePDF(licenseData: LicenseData): Promise<Buffer> {
    // In production, use puppeteer or similar to generate PDF
    // For now, return the HTML as buffer
    const html = this.generateLicenseDocument(licenseData)
    return Buffer.from(html, "utf-8")
  }

  static calculateLicenseHash(data: LicenseData): string {
    const hashString = `${data.licenseId}-${data.songTitle}-${data.userEmail}-${data.purchaseDate.getTime()}`
    // Simple hash for demo - use crypto in production
    let hash = 0
    for (let i = 0; i < hashString.length; i++) {
      const char = hashString.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).toUpperCase()
  }
}
