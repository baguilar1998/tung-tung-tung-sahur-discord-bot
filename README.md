# Tung Tung Tung Sahur

A Discord bot that talks as Tung Tung Tung Sahur. He answers when someone @mentions him. In a server channel that is already busy, he also steps in once in a while: at least four messages from two people within two minutes, about a one-in-four chance, then he stays quiet for three minutes. With a free Groq key he writes the reply himself. The character sheet in `src/personality/character.ts` goes out with every message. Prepared lines answer a mention if the model is quiet or the free cap is used up. He does not use those lines when he steps in on his own.

![Tung Tung Tung Sahur at the pos ronda](assets/tung-tung-tung-sahur.png)

## Who he is

Tung Tung Tung Sahur (Triple T) showed up on 28 February 2025, the day before Ramadan in Indonesia. TikToker Noxa, Fernanda Bagas Indrastata, asked an image model for a pentungan sahur with a face and legs, then a neighborhood-watch kentungan. The picture that stuck is the one above: a wooden body, bare feet, a patrol club, a night street, and a sign for the pos ronda.

He is an anthropomorphic **kentongan**, the slit drum Indonesian villages bang to wake people for **sahur**, the meal before dawn during Ramadan. "Tung tung tung" is the sound of that drum. The thing in his hand is a **pentungan**. People call it a baseball bat. He does not.

The original narration is a mock-horror legend: he is a terrifying anomaly who only comes out at sahur. If someone is called three times and does not answer (tidak nyaut), he comes to the house. The joke spread as Italian-brainrot's Indonesian cousin. He got powerscaled against Brr Brr Patapim, stood next to Tralalero Tralala and Bombardiro Crocodilo, and at the end of Ramadan people sent him home on imaginary flights. He has kept going as a shitpost, including turns through Roblox and Fortnite.

This bot stays in that voice. Short sentences. A little Indonesian. The three-call count is real: tell him you are still in bed three times and he arrives. Tell him you are awake and the count clears. The sheet is part of the program, so the model cannot forget it. A Cursor skill would only be read in the editor, not in Discord.

## What you need

- Node.js 20 or newer
- A Discord account, and a server where you can add a bot
- This project, on a computer that can stay on while you want him online

## Connect him to your server

### 1. Create the Discord application

1. Open [the Discord Developer Portal](https://discord.com/developers/applications) and log in.
2. Click **New Application**. Name it `Tung Tung Tung Sahur`. Accept the developer terms.
3. Open **Bot** in the sidebar.
4. Click **Reset Token**, confirm, and copy the token. Discord shows it once. You will paste it into `.env` in the next section. If it ever leaks, come back here and reset it. Do not commit it, and do not send it in chat.
5. Set the bot's name. Usernames cannot contain spaces, so if `Tung Tung Tung Sahur` is rejected, use something like `tungtungtungsahur`. You can still nickname him `Tung Tung Tung Sahur` inside your server.
6. Upload `assets/tung-tung-tung-sahur.png` as the avatar.
7. Under **Privileged Gateway Intents**, turn **Message Content Intent** on. Leave Server Members Intent and Presence Intent off. The message intent is what lets him read the words next to the @.
8. Leave **Public Bot** on. Turning it off makes the application private, and Discord then rejects the save until the Installation tab's install link is **None**. A public bot is still invite-only: people need the link you generate below. The "Verified apps must be public" note does not apply to a new app.

### 2. Invite him

1. Open **OAuth2**, then **URL Generator**.
2. Under scopes, check **bot**.
3. Under bot permissions, check **View Channels**, **Send Messages**, and **Read Message History**.
4. Copy the generated URL, open it, choose your server, and authorize. You need the Manage Server permission there.

The same invite, if you already know the Application ID from **General Information**:

```text
https://discord.com/oauth2/authorize?client_id=YOUR_APPLICATION_ID&scope=bot&permissions=68608
```

Replace `YOUR_APPLICATION_ID` with the ID from that page. `68608` is those three permissions and nothing else.

If a channel hides itself from the bot, open the channel's permissions and allow his role to view the channel, send messages, and read history.

### 3. Run him

From this folder:

```bash
npm install
cp .env.example .env
```

Open `.env` and replace `your-bot-token` with the token you copied. Save the file.

```bash
npm test
npm run dev
```

When the terminal says he is on duty, go to Discord and send:

```text
@Tung Tung Tung Sahur who are you
```

Pick him from the mention menu so Discord attaches a real ping. Typing the name without the ping does nothing. @everyone, @here, and role pings do nothing either. A reply to one of his messages also needs to ping him.

Leave that terminal open. Closing it, or stopping the process, takes him offline. If he has spoken in a channel, he posts one last line there: he is going to sleep and the drum is offline. A force-kill gives him no time to send it. Groq's free tier covers the model. This computer still has to stay awake. Past the daily free cap, or if Groq is down, he uses the prepared lines.

For a process you restart less often:

```bash
npm run build
npm start
```

After you change `.env`, stop the process and start it again.

## Try these

- `@Tung Tung Tung Sahur who are you`
- `@Tung Tung Tung Sahur I'm sleeping` (say it again, and again)
- `@Tung Tung Tung Sahur I'm up`
- `@Tung Tung Tung Sahur what time is it`
- `@Tung Tung Tung Sahur patapim`
- `@Tung Tung Tung Sahur help`

The three-call count follows each person until the process stops. The last few lines in a channel stay in memory so he can follow a conversation. Nothing is written to disk.

He answers in Bahasa-seasoned English because that is how the meme traveled. Sahur hours follow Asia/Jakarta, 02:30 to 05:00. Outside that window he still answers a ping, and he complains about it.

## If he stays quiet

| What you see | What to do |
| --- | --- |
| `Used disallowed intents` | Turn on Message Content Intent, save, then start the bot again. |
| `invalid token` | Reset the token on the Bot page, paste the new one into `.env`, start again. |
| He is in the member list and says nothing | The message did not ping his user. Use the mention menu. |
| `Missing Permissions` | Allow his role in that channel, or invite him again with the URL above. |
| He works, then vanishes | The terminal closed. Start `npm run dev` again. |

## Why TypeScript

Discord's API is a JSON gateway, and [discord.js](https://discord.js.org/) is the library that tracks it most closely. TypeScript is that library's language, with a compiler in front of it. The mention rule, the strike count, and the voice are ordinary functions with tests, so they can be checked without logging into Discord. Python and discord.py would also make a good bot. This one is the typed version.

## Layout

```text
src/index.ts                 starts the process
src/config.ts                reads DISCORD_TOKEN and the optional Groq key
src/discord/startBot.ts      Discord connection, mention check, reply
src/bot/responder.ts         who gets an answer, cooldown, memory, backup lines
src/personality/character.ts the sheet sent to the model every turn
src/ai/                      Groq client and the prompt built around the sheet
tests/                       the personality and the prompt, without Discord
```

```bash
npm test
npm run typecheck
```

## Keeping the token safe

`.env` is gitignored. `.env.example` holds the placeholder. If the token is ever posted, reset it in the Developer Portal before starting the bot again.
