export class SteamAuth {
  static getLoginArgs(username?: string, password?: string, steamGuardCode?: string): string[] {
    if (username) {
      if (password) {
        if (steamGuardCode) {
          return ['+login', username, password, steamGuardCode];
        }
        return ['+login', username, password];
      }
      return ['+login', username]; // Try cached login
    }
    return ['+login', 'anonymous'];
  }

  static isSteamGuardPrompt(output: string): boolean {
    const lower = output.toLowerCase();
    return lower.includes('steam guard') || lower.includes('two-factor') || lower.includes('enter the current code');
  }

  static isInvalidPassword(output: string): boolean {
    const lower = output.toLowerCase();
    return lower.includes('failed (invalid password)');
  }

  static isAccountLogonDenied(output: string): boolean {
    const lower = output.toLowerCase();
    return lower.includes('failed (account logon denied)');
  }

  static isMobileAuthRequested(output: string): boolean {
    const lower = output.toLowerCase();
    // Usually outputs "Waiting for user info...OK" or "Steam Guard App" when waiting for mobile app approval
    return lower.includes('waiting for user info') || lower.includes('app approval required');
  }
}
