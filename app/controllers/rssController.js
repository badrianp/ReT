import Parser from 'rss-parser';

const parser = new Parser();

export async function getRssFeed(req, res) {
  try {
    const feed = await parser.parseURL('https://feeds.bbci.co.uk/news/technology/rss.xml');

    // console.log('FIRST ITEM:');
    // console.log(feed.items[0]);

    const topItems = feed.items.slice(0, 10).map(item => ({
      title: item.title,
      url: item.link,
      content: item.content
    }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(topItems));
  } catch (error) {
    console.error('error reading RSS:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'error reading RSS feed' }));
  }
}