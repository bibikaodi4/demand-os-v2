export {};
import { createDirectus, rest, createItem } from '@directus/sdk';
import OpenAI from 'openai';

// ================= 1. 配置中心 (正式运行版) =================
const CONFIG = {
    // 运行模式
    MODE: 'mock', 

    // Directus 数据库配置
    DIRECTUS_URL: 'http://admin.cnsubscribe.xyz',
    DIRECTUS_TOKEN: 'vuaTQ8aMSqw8R5PIfNircWSa7XbHpym7',

    // Nova AI 配置
    LLM_KEY: 'sk-LIs2MGKmDuGZhcfHbvLs1EiWHPwm2ELf3E8JkJXlFXgFLPBM', 
    LLM_URL: 'https://once.novai.su/v1',
    
    // ⭐ 模型: 使用 Mini 模型
    MODEL_NAME: '[逆次]o4-mini', 
};

// ================= 2. 初始化客户端 =================
console.log(`🚀 AGENT STARTED (使用模型: ${CONFIG.MODEL_NAME})`);

const client = createDirectus(CONFIG.DIRECTUS_URL).with(rest({
    onRequest: (options) => ({ ...options, headers: { ...options.headers, Authorization: `Bearer ${CONFIG.DIRECTUS_TOKEN}` } }),
}));

const openai = new OpenAI({ apiKey: CONFIG.LLM_KEY, baseURL: CONFIG.LLM_URL });


// ================= 3. 辅助函数 =================
function getMsUntilBeijing6AM() {
    const now = new Date();
    const target = new Date(now);
    target.setHours(30, 0, 0, 0); // 简单处理
    return target.getTime() - now.getTime();
}


// ================= 4. 模块 A: 模拟生成器 =================
async function getMockSignal() {
    const CHAOS = {
        platforms: ['抖音', '小红书', '微博', '朋友圈'],
        categories: ["智能家居", "宠物用品", "车载好物", "厨房神器", "电竞外设", "美妆护肤"],
        personas: ["00后整顿职场", "精致宝妈", "硬核数码博主", "贫民窟大学生", "防诈骗反向种草", "送礼困难户"],
        contexts: ["开箱真香", "吐槽平替", "求链接", "避坑指南", "补货通知", "生活小妙招"]
    };

    const platform = CHAOS.platforms[Math.floor(Math.random() * CHAOS.platforms.length)];
    const category = CHAOS.categories[Math.floor(Math.random() * CHAOS.categories.length)];
    const persona = CHAOS.personas[Math.floor(Math.random() * CHAOS.personas.length)];
    const context = CHAOS.contexts[Math.floor(Math.random() * CHAOS.contexts.length)];

    console.log(`\n🎭 [CHAOS GEN] 抽取剧本: ${platform} | ${category} | ${persona}`);

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ 
                role: "system", 
                content: `角色: ${persona}。平台: ${platform}。主题: "${category}"领域的一个具体产品。场景: ${context}。
                要求: 写一个简短(50字以内)、极度口语化的种草/吐槽贴。必须用简体中文。
                输出: 仅返回帖子正文。` 
            }],
            model: CONFIG.MODEL_NAME, 
            temperature: 1.0, 
        });

        await new Promise(r => setTimeout(r, 500));

        return {
            platform: platform.split(' ')[0],
            rawText: completion?.choices?.[0]?.message?.content ?? completion?.choices?.[0]?.text ?? "太好用了！",
        };

    } catch (e: any) {
        console.error("   ⚠️ 生成失败:", e.message);
        return { platform: '系统', rawText: "模拟失败", product_hint: "错误" };
    }
}


// ================= 5. 模块 B: 商业分析器 =================
async function analyzeDemand(rawText: string, platform: string) {
    console.log(`   🧠 [THINKING] 正在分析商业价值...`);
    
    try {
        const completion = await openai.chat.completions.create({
            messages: [{ 
                role: "system", 
                content: `你是电商专家。分析社媒内容，提取 JSON (值必须是简体中文):
                product_name, target_price(数字), buyer_region, sentiment, demand_score(0-100),
                trend_status(爆发中/上升期/平稳期/已饱和), competition_level(蓝海/中等/红海), profit_margin(数字), target_audience, traffic_channel.`
            }, {
                role: "user",
                content: `平台: ${platform}\n内容: "${rawText}"`
            }],
            model: CONFIG.MODEL_NAME,
            response_format: { type: "json_object" }
        });
        const text = completion?.choices?.[0]?.message?.content ?? completion?.choices?.[0]?.text ?? '';
        // 尝试从可能包含 ```json ``` 的回复中抽取 JSON 字符串
        const cleaned = (text || '').replace(/```json|```/g, '').trim();
        // 尝试找到第一个 `{` 和最后一个 `}`
        const first = cleaned.indexOf('{');
        const last = cleaned.lastIndexOf('}');
        if (first !== -1 && last !== -1 && last > first) {
            const jsonStr = cleaned.slice(first, last + 1);
            try {
                return JSON.parse(jsonStr);
            } catch (parseErr) {
                console.warn('   ⚠️ JSON 解析失败，返回原始解析:', parseErr.message);
            }
        }
        // 回退：尝试直接 parse 整体
        try {
            return JSON.parse(cleaned || '{}');
        } catch (e2) {
            console.warn('   ⚠️ 最终 JSON 解析失败，返回空结果。');
            return {};
        }
    } catch (e: any) {
        console.error("   ❌ 分析失败:", e?.message ?? e);
        return { product_name: "分析错误", demand_score: 0 };
    }
}


// ================= 6. 模块 C: 数据库执行层 =================
async function executeAction(data: any, platform: string) {
    if(!data || !data.product_name) return;
    try {
        await client.request(createItem('agent_logs', {
            type: 'process',
            content: `分析: [${data.target_audience}] 产品: ${data.product_name}`
        }));

        await client.request(createItem('demands', {
            product_name: data.product_name,
            platform: platform,
            target_price: data.target_price,
            quantity: Math.floor(data.demand_score * 10) + 50,
            buyer_region: data.buyer_region || '全球',
            status: 'inbound',
            sentiment: data.sentiment,
            demand_score: data.demand_score,
            trend_status: data.trend_status || '上升期',
            competition_level: data.competition_level || '中等',
            profit_margin: data.profit_margin || 20,
            target_audience: data.target_audience || '大众',
            traffic_channel: data.traffic_channel || platform,
            date_created: new Date().toISOString()
        }));
        
        const trendIcon = data.trend_status === '爆发中' ? '🔥' : '📈';
        await client.request(createItem('agent_logs', {
            type: 'success',
            content: `>>> 机会锁定: ${data.product_name} | 利润: ${data.profit_margin}% ${trendIcon}`
        }));
        
        console.log(`   ✅ [SAVED] ${data.product_name} (Margin: ${data.profit_margin}%)`);

    } catch (error: any) {
        console.error('   ❌ 入库失败:', error.message);
    }
}


// ================= 7. 主程序入口 =================
async function main() {
    const TARGET_DAILY_COUNT = 100; 

    console.log(`\n🚀 [DEV MODE] 立即开始批量任务 (目标: ${TARGET_DAILY_COUNT}条)...`);

    for (let i = 1; i <= TARGET_DAILY_COUNT; i++) {
        console.log(`\n⚡ 正在处理第 ${i}/${TARGET_DAILY_COUNT} 条...`);
        
        const signal = await getMockSignal(); 
        const analysis = await analyzeDemand(signal.rawText, signal.platform);
        await executeAction(analysis, signal.platform);

        const coolDown = Math.floor(Math.random() * 2000) + 1000;
        console.log(`   ☕ 冷却 ${Math.round(coolDown/1000)}s...`);
        await new Promise(r => setTimeout(r, coolDown));
    }

    console.log(`🛑 [完成] 100条数据生成完毕，程序退出。`);
    process.exit(0);
}

// 捕获主流程未捕获的异常，保证脚本可观察到错误并优雅退出
async function run() {
    try {
        await main();
    } catch (err: any) {
        console.error('主流程发生未捕获错误:', err?.message ?? err);
        process.exit(1);
    }
}

run();