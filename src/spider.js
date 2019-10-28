import {findGameList, findPage} from "./controller/gameController";

const config = require("config");
const Koa = require('koa');
const Router = require('@koa/router');

const app = new Koa();
const router = new Router();

// 定义路由
router.get("/game/findGameList", findGameList);
router.get("/game/findPage", findPage);

// 添加路由中间件
app.use(router.routes());

app.listen(config.get("service.port"));


const puppeteer = require("puppeteer-core");
const axios = require("axios");
const fs = require("fs");

if (config.get("spider.autoStart")){
    let browser;
    let browserPage;
    (async () => {
        try {
            browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                executablePath: config.get("spider.chromePath"),
                headless: config.get("spider.headless")
            });
            browserPage = await browser.newPage();
            await crawGameList();
        } catch (e) {
            console.error("app异常", e)
        } finally {
            if (browser != null){
                browser.close();
            }
        }
    })();
}

/**
 * 爬取游戏列表
 */
async function crawGameList(){
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

        // 爬取游戏列表中的游戏数据
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

            // 爬取游戏
            try {
                await crawGame(game);
            } catch (e) {
                console.error("爬取游戏列表, 爬取游戏列表中的游戏数据异常", game, e);
            }

            console.log("爬取游戏列表, 爬取游戏列表中的游戏数据, 当前进度", j, "总数", gameListRet.length);
        }

        // 睡眠
        await sleep(1000);
        console.log("爬取游戏列表, 请求游戏api, 当前进度:"+i+", 总数:"+pageCount);
    }
    console.log("爬取游戏列表, 完成");
}

/**
 * 爬取游戏的url
 * @param detailUrl
 * @returns {Promise<any>}
 */
async function crawGameUrl(detailUrl) {
    try {
        await browserPage.goto(detailUrl);

        // 点击开始游戏按钮
        let playBtnSelector = ".play .btn";
        await browserPage.waitForSelector(playBtnSelector);
        await browserPage.click(playBtnSelector);

        // 取出游戏链接
        let gameIframeSelector = "iframe#flash22";
        await browserPage.waitForSelector(gameIframeSelector)
        const gameUrl = await browserPage.$eval(gameIframeSelector, el => el.src);
        console.log("爬取游戏的url, 完成, detailUrl:"+detailUrl+", gameUrl:"+gameUrl);
        return gameUrl;
    } catch (e) {
        console.error("爬取游戏的url, 异常:"+e);
    }

    return Promise.resolve("");
}

/**
 * 爬取游戏
 * @param gameList
 */
async function crawGame(game) {
    let GameDao = require("./dao/gameDao");
    let gameDao = new GameDao();
    let Game = require("./model/game")

    // 判断游戏是否存在
    let existGame = await gameDao.findOne({"title": game.title});
    if (existGame){
        console.log("爬取游戏, 已存在", existGame);
        return Promise.resolve("已存在");
    }

    console.log("爬取游戏, 不存在, 即将入库", game);

    // 爬取游戏的url
    game["link"] = await crawGameUrl(game.detailUrl);

    // 写入mongo
    let gameObject = new Game({"title": game.title, "label": game.label, "coverUrl": game.coverUrl, "link": game.link, "status": 1});
    let result = await gameDao.save(gameObject);
    console.log("爬取游戏, 插入完成", result);

    // 睡眠
    await sleep(500);

    console.log("爬取游戏, 完成", game);
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
