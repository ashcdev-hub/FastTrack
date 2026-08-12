#!/bin/sh
# Keep FastTrack Supabase project awake — free-tier pause prevention.
# Backup layer to the GitHub Actions cron (which may be disabled if the
# account is locked for billing or the repo goes >60 days idle).
# Pings REST + Auth health; any response (even 4xx) resets the inactivity timer.

ENV_FILE="/Users/ash/FastTrack/.env"
LOG="$HOME/Library/Logs/keep-supabase-awake.log"

KEY=$(grep '^EXPO_PUBLIC_SUPABASE_ANON_KEY=' "$ENV_FILE" | head -1 | cut -d= -f2 | tr -d '"' | tr -d "'")
if [ -z "$KEY" ]; then
  echo "$(date): ERROR no EXPO_PUBLIC_SUPABASE_ANON_KEY in $ENV_FILE" >> "$LOG"
  exit 0
fi

rest=$(curl -s -o /dev/null -w "%{http_code}" --max-time 60 \
  "https://zytqfjjvruehnkntojjd.supabase.co/rest/v1/profiles?select=id&limit=1" \
  -H "apikey: $KEY" 2>/dev/null)
auth=$(curl -s -o /dev/null -w "%{http_code}" --max-time 60 \
  "https://zytqfjjvruehnkntojjd.supabase.co/auth/v1/health" 2>/dev/null)

echo "$(date): REST=$rest AUTH=$auth" >> "$LOG"

if [ "$rest" = "000" ] && [ "$auth" = "000" ]; then
  echo "$(date): WARNING Supabase unreachable (paused or down?)" >> "$LOG"
fi

exit 0
