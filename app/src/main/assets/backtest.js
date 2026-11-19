// A股智能选股器 V1.5
// 独立历史回测引擎
// 初始版本：资金与交易规则

const BACKTEST_CONFIG = {
  initialCapital: 500000,

  periods: {
    "1年": 365,
    "2年": 730,
    "3年": 1095
  },

  defaultPeriod: "3年",

  maxDrawdownLimit: 0.25,

  commissionRate: 0.0003,

  stampDutyRate: 0.0005,

  slippageRate: 0.001,

  minimumCommission: 5,

  lotSize: 100,

  tPlusOne: true,

  excludeST: true,

  excludeSuspended: true
};

// 计算买入费用
function calculateBuyFee(amount) {
  const commission = Math.max(
    amount * BACKTEST_CONFIG.commissionRate,
    BACKTEST_CONFIG.minimumCommission
  );

  const slippage = amount * BACKTEST_CONFIG.slippageRate;

  return commission + slippage;
}

// 计算卖出费用
function calculateSellFee(amount) {
  const commission = Math.max(
    amount * BACKTEST_CONFIG.commissionRate,
    BACKTEST_CONFIG.minimumCommission
  );

  const stampDuty =
    amount * BACKTEST_CONFIG.stampDutyRate;

  const slippage =
    amount * BACKTEST_CONFIG.slippageRate;

  return commission + stampDuty + slippage;
}

// 计算最大回撤
function calculateMaxDrawdown(equityCurve) {
  if (!Array.isArray(equityCurve) ||
      equityCurve.length === 0) {
    return 0;
  }

  let peak = equityCurve[0];
  let maxDrawdown = 0;

  for (const value of equityCurve) {
    if (!Number.isFinite(value) || value < 0) {
      continue;
    }

    peak = Math.max(peak, value);

    if (peak > 0) {
      const drawdown = (peak - value) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  }

  return maxDrawdown;
}

// V1.5 历史行情数据验证
async function testHistoryData510300(periodDays = 1095) {
  const code = "510300";
  const secid = "1.510300";

  const url =
    "https://push2his.eastmoney.com/api/qt/stock/kline/get" +
    "?secid=" + secid +
    "&fields1=f1,f2,f3,f4,f5,f6" +
    "&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61" +
    "&klt=101&fqt=1&beg=0&end=20500101&lmt=1000";

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("历史行情请求失败");
    }

    const result = await response.json();
    const rows = result?.data?.klines;

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error("没有获取到历史K线");
    }

    const bars = rows.map(row => {
      const a = row.split(",");

      return {
        date: a[0],
        open: Number(a[1]),
        close: Number(a[2]),
        high: Number(a[3]),
        low: Number(a[4]),
        volume: Number(a[5])
      };
    }).filter(bar =>
      bar.date &&
      Number.isFinite(bar.open) && bar.open > 0 &&
      Number.isFinite(bar.close) && bar.close > 0 &&
      Number.isFinite(bar.high) && bar.high >= bar.close &&
      Number.isFinite(bar.low) && bar.low > 0 &&
      Number.isFinite(bar.volume) && bar.volume >= 0
    );

    const endDate = new Date();
    const startDate = new Date(
      endDate.getTime() - periodDays * 86400000
    );
    const startText = startDate.toISOString().slice(0, 10);

    const selectedBars = bars.filter(
      bar => bar.date >= startText
    );

    return {
      success: selectedBars.length >= 500,
      code,
      periodDays,
      count: selectedBars.length,
      firstDate: selectedBars[0]?.date || null,
      lastDate: selectedBars[selectedBars.length - 1]?.date || null,
      bars: selectedBars,
      message: selectedBars.length >= 500
        ? "历史K线数据初步获取成功"
        : "历史K线数量不足，暂不能进行三年回测"
    };

  } catch (error) {
    return {
      success: false,
      code,
      count: 0,
      bars: [],
      message: error.message || "历史数据获取失败"
    };
  }
}
