import { rss, serve, type FeedEntry } from "./deps.ts"
import { config } from "./config.ts"
console.log("starting...")

const startTime = Math.floor( Date.now() / 1000 )

console.log(startTime)

async function checkRSS() {
    await new Promise(f => setTimeout(f, 5000))
    console.log("RSS Job started")

    let lastFeed: string | null = null
    
    while (true) {
        let posts: FeedEntry[] = []
        const response = await fetch(
            "https://globalnews.ca/entertainment/feed/",
          )
        const xml = await response.text()
        const feed = await rss.parseFeed(xml)
        if (lastFeed) {
            for (const post of feed.entries) {
                if (post.title?.value === lastFeed){
                    break
                }
                posts.push(post)
                }
        } else {
            console.log("No last feed found. Posting everything")
            posts = feed.entries
        }

        if (posts) {
            for (const post of posts.reverse()) {
            let text = ""
            if (post) {
                if (post.title){
                    text += `<b>${post.title?.value}</b>\n\n`
                }
                if (post.description) {
                    text += `<i>${post.description.value}</i>`
                }
                let imageUrl: string | undefined
                if (post.attachments) {
                    for (const attachment of post.attachments) {
                        if (attachment.mimeType?.startsWith("image")){
                            imageUrl = attachment.url
                            break
                        }
                    }
                }
                if (imageUrl){
                    const status = await sendImage(imageUrl, text)
                    if (!status){
                        await sendMessage(text)
                    }
                } else {
                    await sendMessage(text)
                }
            }
            await new Promise(f => setTimeout(f, 5000))
            lastFeed = post.title?.value ? post.title?.value : null
            }
     }

        await new Promise(f => setTimeout(f, 20000))
  }}

async function sendImage(image: string, caption: string){
    const body = JSON.stringify({
        "chat_id": config.CHAT_ID,
        "caption": caption,
        "photo": image,
        "parse_mode": "HTML",
    })
   const resp = await fetch("https://api.telegram.org/bot" + config.BOT_TOKEN + "/sendPhoto", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body,
})
if (resp.status == 200){
    return true
} else {
    return false
}
}
async function sendMessage(msg: string) {

    const body = JSON.stringify({
        "chat_id": config.CHAT_ID,
        "text": msg,
        "parse_mode": "HTML",
        "disable_web_page_preview": true,
    })
   const resp = await fetch("https://api.telegram.org/bot" + config.BOT_TOKEN + "/sendMessage", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body,
})
if (resp.status == 200){
    return true
} else {
    return false
}
}

function TimeFormat(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const days = Math.floor(hours / 24);
    let timeStr = "";
    if (days > 0) {
        timeStr += `${days} days, `;
    }
    timeStr += `${hours} hours, ${minutes} minutes, ${seconds} seconds`;
    return timeStr;
}

const aserve = () => new Promise((_, __) => setTimeout(() => serve((_: unknown) => new Response(JSON.stringify({"uptime": TimeFormat(Math.floor( Date.now() / 1000 ) - startTime)}))), 1000))

Promise.all([aserve(), checkRSS()])