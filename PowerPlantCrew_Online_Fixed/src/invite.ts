/**
 * Public lobby invitations. A room code is not an authentication secret;
 * players authenticate with their own SpacetimeDB identity upon connecting.
 */
export function makeLobbyInvite(
  lobbyCode: string,
  currentOrigin: string,
  preferredPublicSite?: string,
): { url: string; publicHttps: boolean; notice: string } {
  const site = preferredPublicSite?.trim() || currentOrigin;
  let url: URL;
  try {
    url = new URL(site);
  } catch {
    return { url: '', publicHttps: false, notice: 'Invalid VITE_PUBLIC_SITE_URL. Use a full HTTPS website address.' };
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    return { url: '', publicHttps: false, notice: 'Invite URL must use HTTP or HTTPS.' };
  }
  url.pathname = '/';
  url.hash = '';
  url.search = '';
  url.searchParams.set('room', lobbyCode.trim().toUpperCase());
  const host = url.hostname.toLowerCase();
  // A working QR must open an internet-accessible site, not a private computer.
  const local = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(host)
    || host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.test')
    || /^192\.168\./.test(host) || /^10\./.test(host)
    || /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    || /^169\.254\./.test(host) || /^127\./.test(host)
    || /^fc[0-9a-f]{2}:/.test(host) || /^fd[0-9a-f]{2}:/.test(host);
  const publicHttps = url.protocol === 'https:' && !local;
  return {
    url: url.toString(),
    publicHttps,
    notice: publicHttps ? '' :
      'This QR cannot invite phones over the internet yet. Deploy the site to public HTTPS (Vercel/Netlify) or set VITE_PUBLIC_SITE_URL to your deployed website.',
  };
}
