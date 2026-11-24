import { File, Paths } from 'expo-file-system';
import { Share } from 'react-native';

import { getBackupFileName } from './backup-format';

/**
 * Writes the backup JSON to a temporary file and opens the iOS share sheet ("Save to Files",
 * AirDrop, …). Everything stays local unless the player chooses a destination.
 * @returns {Promise<{ shared: boolean }>}
 */
export async function shareBackupFile(backup, now = new Date()) {
  const file = new File(Paths.cache, getBackupFileName(now));
  if (file.exists) file.delete();
  file.create();
  await file.write(JSON.stringify(backup));
  const result = await Share.share({ url: file.uri });
  return { shared: result.action === Share.sharedAction };
}

/**
 * Lets the player pick a backup file and returns its text, or null if they cancel.
 */
export async function pickBackupFileText() {
  const picked = await File.pickFileAsync({ mimeTypes: ['application/json', 'public.json', 'public.text'] });
  if (picked.canceled) return null;
  return picked.result.text();
}
