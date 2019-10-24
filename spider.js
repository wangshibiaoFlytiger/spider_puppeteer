import {config} from "config";
const puppeteer = require("puppeteer");
const axios = require("axios");
const fs = require("fs");

crawGameList();

/**
 * 爬取游戏列表
 */
async function crawGameList(){
    let gameList = [];
    let pageCount = 633;
    // 请求游戏api, 获取游戏列表
    for (let i = 0; i < pageCount; i++) {
        // 请求游戏列表api
        let apiUrl = "http://h.4399.com/data/pc_xyx_new_"+i+".js"
        let resp = await axios({
            url: apiUrl
        });

        if (resp.status != 200){
            console.log("爬取游戏列表， 请求游戏列表api, 异常")
            continue;
        }

        // 组装游戏列表
        let respData = resp.data;
        let gameListRet = respData.data;
        for (let j = 0; j < gameListRet.length; j++) {
            let element = gameListRet[j];
            let game = {
                title: element.title,
                label: element.category,
                coverUrl: element.pic,
                detailUrl: element.pczzylink
            };
            gameList.push(game);
        }

        // 睡眠
        sleep(1000);
        console.log("爬取游戏列表, 请求游戏api, 当前进度:"+i+", 总数:"+pageCount);
    }
    console.log("爬取游戏列表, 请求游戏api, 完成");

    // 补充游戏url
    await supplyGameUrl(gameList);
    console.log("爬取游戏列表, 补充游戏url, 完成");

    // 将爬取结果数据写入文件
    fs.writeFile('./gameList', JSON.stringify(gameList),  function(err) {
        if (err) {
            return console.error(err);
        }

        console.log("爬取游戏列表, 将爬取结果数据写入文件, 完成");
    });
}

/**
 * 获取游戏的url
 * @param detailUrl
 * @returns {Promise<any>}
 */
async function getGameUrl(detailUrl) {
    const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox'], executablePath: config.chromePath, headless: config.headless});
    try {
        let page = await browser.newPage();
        await page.goto(detailUrl);

        // 点击开始游戏按钮
        let playBtnSelector = ".play .btn";
        await page.waitForSelector(playBtnSelector);
        await page.click(playBtnSelector);

        // 取出游戏链接
        let gameIframeSelector = "iframe#flash22";
        await page.waitForSelector(gameIframeSelector)
        const gameUrl = await page.$eval(gameIframeSelector, el => el.src);
    } catch (e) {
        console.error("获取游戏的url, 异常:"+e);
    }
    await browser.close();

    console.log("获取游戏的url, 完成, detailUrl:"+detailUrl+", gameUrl:"+gameUrl);
    return gameUrl;
}

/**
 * 补充游戏url
 * @param gameList
 */
async function supplyGameUrl(gameList) {
    for (let i = 0; i < gameList.length; i++) {
        try {
            let game = gameList[i];
            game["link"] = await getGameUrl(game.detailUrl);

            // 睡眠
            sleep(500);
        } catch (e) {
            console.error("补充游戏url, 异常:"+e)
        }
        console.log("补充游戏url, 当前进度:"+ i + ", 总数:"+ gameList.length);
    }

    console.log("补充游戏url, 完成, 总数:"+ gameList.length);
}

/**
 * 睡眠
 * @param time
 * @returns {Promise<unknown>}
 */
function sleep(time = 0) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    })
};
