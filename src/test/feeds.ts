import { getNews } from "../services/feeds.ts";

const news = await getNews();
console.log(news);
