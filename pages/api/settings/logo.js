import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

// Pastikan folder data ada
const ensureDataDir = () => {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Baca pengaturan dari file
const readSettings = () => {
  ensureDataDir();
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading settings:', error);
  }
  
  // Default settings
  return {
    websiteTitle: 'ACA Publisher',
    logo: '/piano-logo.svg',
    primaryColor: '#1E40AF',
    secondaryColor: '#60A5FA',
    accentColor: '#F59E0B',
    fontFamily: 'Inter'
  };
};

// Simpan pengaturan ke file
const writeSettings = (settings) => {
  ensureDataDir();
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing settings:', error);
    return false;
  }
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const settings = readSettings();
      res.status(200).json({ success: true, settings });
    } catch (error) {
      res.status(500).json({ error: 'Failed to read settings' });
    }
  } else if (req.method === 'POST') {
    try {
      const { logo } = req.body;
      
      if (!logo) {
        return res.status(400).json({ error: 'Logo URL is required' });
      }

      const currentSettings = readSettings();
      const updatedSettings = {
        ...currentSettings,
        logo
      };

      const success = writeSettings(updatedSettings);
      
      if (success) {
        res.status(200).json({ 
          success: true, 
          message: 'Logo settings updated successfully',
          settings: updatedSettings
        });
      } else {
        res.status(500).json({ error: 'Failed to save settings' });
      }
    } catch (error) {
      console.error('API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}