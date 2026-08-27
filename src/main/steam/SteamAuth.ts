export class SteamAuth {
  static getLoginArgs(username?: string, password?: string, steamGuardCode?: string): string[] {
    if (username && password) {
      if (steamGuardCode) {
        return ['+login', username, password, steamGuardCode]
      }
      return ['+login', username, password]
    }
    return ['+login', 'anonymous']
  }

  static isSteamGuardPrompt(output: string): boolean {
    const lower = output.toLowerCase()
    return (
      lower.includes('steam guard') ||
      lower.includes('two-factor') ||
      lower.includes('enter the current code')
    )
  }
}
