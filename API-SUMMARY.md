# QWeather API 开发完整指南

> 本文档整理自 QWeather (和风天气) 开发者文档站点，涵盖所有可调用的 API、认证方式、请求格式、响应格式及最佳实践。
>
> 官方网站：[https://dev.qweather.com](https://dev.qweather.com)

---

## 目录

1. [概述与基本信息](#1-概述与基本信息)
2. [认证方式](#2-认证方式)
3. [API Host 与请求 URL 结构](#3-api-host-与请求-url-结构)
4. [通用规范](#4-通用规范)
5. [通用参数](#5-通用参数)
6. [API 端点完整列表](#6-api-端点完整列表)
   - [6.1 地理信息 (Geo)](#61-地理信息-geo)
   - [6.2 天气预报 (Weather)](#62-天气预报-weather)
   - [6.3 分钟级降水 (Minutely)](#63-分钟级降水-minutely)
   - [6.4 天气预警 (Warning)](#64-天气预警-warning)
   - [6.5 生活指数 (Indices)](#65-生活指数-indices)
   - [6.6 空气质量 (Air Quality)](#66-空气质量-air-quality)
   - [6.7 时光机/历史数据 (Time Machine)](#67-时光机历史数据-time-machine)
   - [6.8 热带气旋 (Tropical Cyclone)](#68-热带气旋-tropical-cyclone)
   - [6.9 海洋 (Ocean)](#69-海洋-ocean)
   - [6.10 太阳辐射 (Solar Radiation)](#610-太阳辐射-solar-radiation)
   - [6.11 天文学 (Astronomy)](#611-天文学-astronomy)
   - [6.12 控制台 (Console)](#612-控制台-console)
7. [响应格式](#7-响应格式)
8. [错误码](#8-错误码)
9. [定价与配额](#9-定价与配额)
10. [最佳实践](#10-最佳实践)
11. [SDK 信息](#11-sdk-信息)

---

## 1. 概述与基本信息

### 版本信息

| 组件 | 版本 | 更新日期 |
|------|------|----------|
| **Web API** | v7.15 | 2023-08-26 |
| **Geo API** | v2.0 | 2022-12-18 |
| **Android SDK** | 5.2.2 | 2026-03-10 |
| **iOS SDK** | 5.2.1 | 2025-12-15 |

### 关键特性

- **协议**：仅支持 HTTPS
- **请求方法**：仅支持 GET
- **响应格式**：JSON，默认 Gzip 压缩
- **认证方式**：JWT (推荐) 或 API KEY
- **多语言**：支持 30+ 种语言
- **单位**：默认公制 (Metric)，可选英制 (Imperial)

### 免费订阅

免费订阅下使用 CC BY-SA 4.0 许可证，需要注明数据来源。免费订阅的 API Host 为 `devapi.qweather.com`（即将停止服务，需迁移到专属 API Host）。

---

## 2. 认证方式

QWeather 支持两种认证方式：**JWT**（推荐）和 **API KEY**。不要同时使用多种认证方式。

### 方式一：JWT 认证（推荐）

JWT 使用 **Ed25519** 算法签名，基于 EdDSA (Edwards-curve Digital Signature Algorithm)，使用 Curve25519 椭圆曲线和 SHA-512。

#### 2.1 生成 Ed25519 密钥对

**使用 OpenSSL（推荐 v3+）：**

```bash
# 生成私钥
openssl genpkey -algorithm ED25519 -out ed25519-private.pem

# 提取公钥
openssl pkey -pubout -in ed25519-private.pem > ed25519-public.pem
```

**使用浏览器（Chrome 137+, Edge 137+, Firefox 129+, Safari 17+）：**

在浏览器控制台执行：

```js
async function generateEd25519Pem() {
  const k = await crypto.subtle.generateKey({name:"Ed25519"},true,["sign","verify"]);
  const p8 = await crypto.subtle.exportKey("pkcs8",k.privateKey);
  const spki = await crypto.subtle.exportKey("spki",k.publicKey);
  const pem = (d,t)=>{
    let b=btoa(String.fromCharCode(...new Uint8Array(d)));
    return`-----BEGIN ${t}-----\n${b.match(/.{1,64}/g).join("\n")}\n-----END ${t}-----`;
  };
  const priv=pem(p8,"PRIVATE KEY");
  const pub=pem(spki,"PUBLIC KEY");
  console.log("PrivateKey:\n",priv,"\n\nPublicKey:\n",pub);
  return{priv,pub};
}
```

#### 2.2 上传公钥

1. 前往 [控制台 - 项目管理](https://console.qweather.com/project)
2. 选择要添加公钥的项目
3. 点击 **添加凭证** 按钮
4. 输入凭证名称
5. 选择认证方式：**JSON Web Token**
6. 粘贴完整的公钥内容（以 `-----BEGIN PUBLIC KEY-----` 开头）
7. 点击保存

保存后会显示凭证创建信息，包括 **Credential ID**。出于安全原因，公钥无法再次查看。

#### 2.3 生成 JWT Token

JWT 由 Header、Payload、Signature 三部分组成，用 `.` 连接：

**Header：**

```json
{
    "alg": "EdDSA",
    "kid": "YOUR_CREDENTIAL_ID"
}
```

| 字段 | 说明 |
|------|------|
| `alg` | 签名算法，固定为 `EdDSA` |
| `kid` | 凭证 ID，从控制台获取 |

**Payload：**

```json
{
    "sub": "YOUR_PROJECT_ID",
    "iat": 1703912400,
    "exp": 1703912940
}
```

| 字段 | 说明 |
|------|------|
| `sub` | 项目 ID (Project ID) |
| `iat` | 签发时间，UNIX 时间戳 (秒) |
| `exp` | 过期时间，UNIX 时间戳 (秒)，最长 24 小时 (86400 秒) |

> **注意**：不要在 Header 和 Payload 中添加其他参数。

**完整 Token 示例：**

```
eyJhbGciOiAiRWREU0EiLCJraWQiOiAiQUJDRDEyMzQifQ.eyJpc3MiOiJBQkNEMTIzNCIsImlhdCI6MTcwMzkxMjQwMCwiZXhwIjoxNzAzOTEyOTQwfQ.MEQCIFGLmpmAEwuhB74mR04JWg_odEau6KYHYLRXs8Bp_miIAiBMU5O13vnv9ieEBSK71v4UULMI4K5T9El6bCxBkW4BdA
```

#### 2.4 各语言 JWT 生成示例

**Python 3：**

```bash
pip3 install cryptography PyJWT
```

```python
import time
import jwt

private_key = """YOUR_PRIVATE_KEY"""

payload = {
    'iat': int(time.time()) - 30,
    'exp': int(time.time()) + 900,
    'sub': 'YOUR_PROJECT_ID'
}
headers = {
    'kid': 'YOUR_KEY_ID'
}

encoded_jwt = jwt.encode(payload, private_key, algorithm='EdDSA', headers=headers)
print(f"JWT: {encoded_jwt}")
```

**Node.js 16+：**

```bash
npm install jose
```

```js
import {SignJWT, importPKCS8} from "jose";

const YourPrivateKey = 'YOUR_PRIVATE_KEY'

importPKCS8(YourPrivateKey, 'EdDSA').then((privateKey) => {
  const customHeader = {
    alg: 'EdDSA',
    kid: 'YOUR_KEY_ID'
  }
  const iat = Math.floor(Date.now() / 1000) - 30;
  const exp = iat + 900;
  const customPayload = {
    sub: 'YOUR_PROJECT_ID',
    iat: iat,
    exp: exp
  }
  new SignJWT(customPayload)
    .setProtectedHeader(customHeader)
    .sign(privateKey)
    .then(token => console.log('JWT: ' + token))
}).catch((error) => console.error(error))
```

**Java 15+：**

```java
// Private key
String privateKeyString = "YOUR PRIVATE KEY";
privateKeyString = privateKeyString.replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "").trim();
byte[] privateKeyBytes = Base64.getDecoder().decode(privateKeyString);
PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(privateKeyBytes);
KeyFactory keyFactory = KeyFactory.getInstance("EdDSA");
PrivateKey privateKey = keyFactory.generatePrivate(keySpec);

// Header
String headerJson = "{\"alg\": \"EdDSA\", \"kid\": \"YOUR_KEY_ID\"}";

// Payload
long iat = ZonedDateTime.now(ZoneOffset.UTC).toEpochSecond() - 30;
long exp = iat + 900;
String payloadJson = "{\"sub\": \"YOUR_PROJECT_ID\", \"iat\": " + iat + ", \"exp\": " + exp + "}";

// Base64url header+payload
String headerEncoded = Base64.getUrlEncoder().encodeToString(headerJson.getBytes(StandardCharsets.UTF_8));
String payloadEncoded = Base64.getUrlEncoder().encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));
String data = headerEncoded + "." + payloadEncoded;

// Sign
Signature signer = Signature.getInstance("EdDSA");
signer.initSign(privateKey);
signer.update(data.getBytes(StandardCharsets.UTF_8));
byte[] signature = signer.sign();
String signatureEncoded = Base64.getUrlEncoder().encodeToString(signature);

String jwt = data + "." + signatureEncoded;
System.out.println("JWT:\n" + jwt);
```

**Shell：**

```bash
#!/bin/bash

kid=YOUR_KEY_ID
sub=YOUR_PROJECT_ID
private_key_path=PATH_OF_YOUR_PRIVATE_KEY

iat=$(( $(date +%s) - 30 ))
exp=$((iat + 900))

header_base64=$(printf '{"alg":"EdDSA","kid":"%s"}' "$kid" | openssl base64 -e | tr -d '=' | tr '/+' '_-' | tr -d '\n')
payload_base64=$(printf '{"sub":"%s","iat":%d,"exp":%d}' "$sub" "$iat" "$exp" | openssl base64 -e | tr -d '=' | tr '/+' '_-' | tr -d '\n')
header_payload="${header_base64}.${payload_base64}"

tmp_file=$(mktemp)
echo -n "$header_payload" > "$tmp_file"

signature=$(openssl pkeyutl -sign -inkey "$private_key_path" -rawin -in "$tmp_file" | openssl base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')

rm -f "$tmp_file"
jwt="${header_payload}.${signature}"
echo "$jwt"
```

### 方式二：API KEY 认证

API KEY 是一种简单的认证方式，但安全性低于 JWT。

> **注意**：从 2027-01-01 起，API KEY 认证的每日请求量将受到限制。

#### 生成 API KEY

1. 前往 [控制台 - 项目管理](https://console.qweather.com/project)
2. 选择目标项目
3. 点击 **创建凭证** → 选择 **API KEY**
4. 输入名称并创建

#### 在请求中使用 API KEY

**方式 A：请求头 (推荐)**

```bash
curl -H "X-QW-Api-Key: ABCD1234EFGH" --compressed \
  'https://abcxyz.qweatherapi.com/v7/weather/now?location=101010100'
```

**方式 B：查询参数**

```bash
curl --compressed \
  'https://abcxyz.qweatherapi.com/v7/weather/now?location=101010100&key=ABCD1234EFGH'
```

### 认证方式兼容性

| 服务 | JWT | API KEY |
|------|-----|---------|
| API v7 | ✅ | ✅ |
| Geo API v2 | ✅ | ✅ |
| Air Quality API v1 | ✅ | ✅ |
| Console API v1 | ✅ | ✅ |
| SDK 5+ | ✅ | ❌ |

---

## 3. API Host 与请求 URL 结构

### API Host

API Host 是每个开发者独有的 API 域名，形如：

```
abc1234xyz.def.qweatherapi.com
```

在 [控制台 - 设置](https://console.qweather.com/setting) 中查看。

> **注意**：旧的共享域名 (`api.qweather.com`, `devapi.qweather.com`, `geoapi.qweather.com`) 将从 2026 年起逐步停止服务，请尽快迁移到专属 API Host。

### 请求 URL 结构

```
https://{api-host}/{endpoint-path}/{path-params}?{query-params}
\___/   \________/\________________________/\_____________/\___________/
scheme    host              path                path         query
                                                params       params
```

各组成部分说明：

| 部分 | 说明 | 示例 |
|------|------|------|
| scheme | 协议，仅 HTTPS | `https://` |
| host | 专属 API Host | `abcxyz.qweatherapi.com` |
| path | API 端点路径 | `/v7/weather/now` |
| path params | 路径参数（必填） | `/{latitude}/{longitude}` |
| query params | 查询参数，`&` 分隔 | `?location=101010100&lang=en` |

### 完整请求示例

```bash
# 使用 JWT 认证
curl --compressed \
  -H 'Authorization: Bearer eyJhbGciOiAiRWREU0EiLCJraWQiOi...' \
  'https://abcxyz.qweatherapi.com/v7/weather/now?location=101010100'

# 使用 API KEY 认证
curl --compressed \
  -H "X-QW-Api-Key: ABCD1234EFGH" \
  'https://abcxyz.qweatherapi.com/v7/weather/now?location=101010100'
```

---

## 4. 通用规范

### Gzip 压缩

所有 API 响应默认使用 **Gzip 压缩**。在请求中必须添加 `--compressed` (curl) 或相应的 `Accept-Encoding: gzip` 头。

各语言 Gzip 处理参考：

| 语言 | Gzip 库/方法 |
|------|-------------|
| C# | `System.IO.Compression.GZipStream` |
| Dart | `dart:io GZipCodec` |
| Go | `compress/gzip` |
| Java | `java.util.zip.GZIPInputStream` |
| Python | `gzip` 模块 |
| Ruby | `Zlib::GzipReader` |

### 多语言支持

通过 `lang` 参数指定语言，支持 30+ 种语言。默认使用国家/地区的官方语言。

**支持的语言代码 (部分)：**

| 语言 | API 代码 | 语言 | API 代码 |
|------|----------|------|----------|
| 简体中文 | `zh`, `zh-hans` | 繁体中文 | `zh-hant` |
| 英语 | `en` | 德语 | `de` |
| 西班牙语 | `es` | 法语 | `fr` |
| 意大利语 | `it` | 日语 | `ja` |
| 韩语 | `ko` | 俄语 | `ru` |
| 印地语 | `hi` | 泰语 | `th` |
| 阿拉伯语 | `ar` | 葡萄牙语 | `pt` |
| 荷兰语 | `nl` | 希腊语 | `el` |
| 瑞典语 | `sv` | 印尼语 | `id` |
| 波兰语 | `pl` | 土耳其语 | `tr` |
| 捷克语 | `cs` | 越南语 | `vi` |
| 芬兰语 | `fi` | 希伯来语 | `he` |
| 挪威语 | `nb` | 菲律宾语 | `fil` |

**语言回退顺序：**

- 未设置语言：官方语言 → 英语
- 设置了语言：指定语言 → 官方语言 → 英语

**例外：**
- 天气指数 (Indices)：仅支持中文和英语
- 分钟级降水 (Minutely)：仅支持中文和英语

### 单位系统

通过 `unit` 参数切换：

| 参数值 | 单位制 |
|--------|--------|
| `m` (默认) | 公制 (Metric) |
| `i` | 英制 (Imperial) |

**单位对照表：**

| 数据项 | 公制 | 英制 |
|--------|------|------|
| 温度 | 摄氏度 (°C) | 华氏度 (°F) |
| 风速 | 公里/小时 (km/h) | 英里/小时 (mile/h) |
| 能见度 | 公里 (km) | 英里 (mile) |
| 气压 | 百帕 (hPa) | 百帕 (hPa) |
| 降水量 | 毫米 (mm) | 毫米 (mm) |
| PM2.5/PM10/O3/SO2/NO2 | μg/m³ | μg/m³ |
| CO | mg/m³ | mg/m³ |

### HTTP 请求方式

所有 API 仅支持 **GET** 请求。其他 HTTP 方法 (POST、PUT 等) 会返回 `405 Method Not Allowed`。

### 参数编码

参数值中的特殊字符必须进行 **URL 编码 (percent-encoding)**：

- **必须编码**：空格 (`%20`)、中文等非 ASCII 字符、逗号 (`,` → `%2C`)
- **无需编码**：英文字母 `A-Z a-z`、数字 `0-9`、`-` `_` `.` `~`

---

## 5. 通用参数

### 位置参数 (location)

根据 API 不同，`location` 参数支持多种格式：

| 参数类型 | 说明 | 示例 |
|----------|------|------|
| LocationID | 城市 ID (9位数字) | `101010100` (北京) |
| 经纬度坐标 | `经度,纬度` (最多2位小数) | `116.41,39.92` |
| 城市名称 | 支持模糊搜索 (英文/中文) | `beijing` 或 `北京` |

> 不同 API 对 `location` 的具体要求不同，详见各 API 端点说明。

### 其他通用参数

| 参数 | 必填 | 说明 | 示例 |
|------|------|------|------|
| `lang` | 否 | 多语言设置 (默认自动) | `en`, `zh` |
| `unit` | 否 | 单位制 `m`(公制) / `i`(英制) | `m` (默认) |
| `key` | 否* | API KEY（查询参数方式认证） | `ABCD1234EFGH` |

> *`key` 仅在 API KEY 认证且使用查询参数方式时使用。

---

## 6. API 端点完整列表

### 6.1 地理信息 (Geo)

Geo API 提供城市搜索、热门城市、POI 搜索等功能，用于获取 LocationID 以调用天气相关 API。

#### 6.1.1 城市搜索 (City Lookup)

```
GET /geo/v2/city/lookup?location={location}&adm={adm}&range={range}&number={number}&lang={lang}
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `location` | ✅ | 城市名称（支持模糊搜索，至少一个汉字或2个英文字符）、LocationID、Adcode 或经纬度坐标 |
| `adm` | 否 | 上级行政区划，用于区分重名城市 |
| `range` | 否 | ISO 3166 国家/地区代码，如 `cn` |
| `number` | 否 | 返回结果数量 1-20，默认 10 |
| `lang` | 否 | 多语言 |

```bash
# 示例：搜索北京
curl --compressed \
  -H 'Authorization: Bearer YOUR_JWT' \
  'https://your-host.qweatherapi.com/geo/v2/city/lookup?location=beijing'

# 模糊搜索 + 限定中国
curl --compressed \
  -H 'Authorization: Bearer YOUR_JWT' \
  'https://your-host.qweatherapi.com/geo/v2/city/lookup?location=bei&range=cn'
```

#### 6.1.2 热门城市 (Top City)

```
GET /geo/v2/city/top?range={range}&number={number}&lang={lang}
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `range` | 否 | ISO 3166 国家/地区代码 |
| `number` | 否 | 返回结果数量 1-20，默认 10 |
| `lang` | 否 | 多语言 |

```bash
# 示例：获取中国热门城市
curl --compressed \
  -H 'Authorization: Bearer YOUR_JWT' \
  'https://your-host.qweatherapi.com/geo/v2/city/top?range=cn&number=10'
```

#### 6.1.3 POI 搜索 (POI Lookup)

```
GET /geo/v2/poi/lookup?location={location}&type={type}&city={city}&number={number}&lang={lang}
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `location` | ✅ | 城市名称、LocationID 或经纬度坐标 |
| `type` | ✅ | POI 类型：`scenic` (景点) 或 `TSTA` (潮汐站) |
| `city` | 否 | 城市名称或 LocationID (精确匹配) |
| `number` | 否 | 返回结果数量 1-20，默认 10 |
| `lang` | 否 | 多语言 |

```bash
# 示例：搜索北京的景点
curl --compressed \
  -H 'Authorization: Bearer YOUR_JWT' \
  'https://your-host.qweatherapi.com/geo/v2/poi/lookup?location=beijing&type=scenic'
```

#### 6.1.4 POI 范围搜索 (POI Range)

```
GET /geo/v2/poi/range?location={lon,lat}&type={type}&radius={radius}&number={number}&lang={lang}
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `location` | ✅ | 经纬度坐标 `lon,lat` (最多2位小数) |
| `type` | ✅ | POI 类型：`scenic` 或 `TSTA` |
| `radius` | 否 | 搜索半径 1-50 km，默认 5 |
| `number` | 否 | 返回结果数量 1-20，默认 10 |
| `lang` | 否 | 多语言 |

---

### 6.2 天气预报 (Weather)

#### 6.2.1 实时天气 (Real-time)

```
GET /v7/weather/now?location={location}&lang={lang}&unit={unit}
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `location` | ✅ | LocationID 或经纬度坐标 `lon,lat` |
| `lang` | 否 | 多语言 |
| `unit` | 否 | 单位制，默认 `m` |

```bash
# 示例：获取北京实时天气
curl --compressed \
  -H 'Authorization: Bearer YOUR_JWT' \
  'https://your-host.qweatherapi.com/v7/weather/now?location=101010100'
```

**主要响应字段：**

| 字段 | 说明 | 单位 |
|------|------|------|
| `obsTime` | 观测时间 (ISO8601) | — |
| `temp` | 温度 | °C 或 °F |
| `feelsLike` | 体感温度 | °C 或 °F |
| `icon` | 天气图标代码 | — |
| `text` | 天气状况文字 | — |
| `windDir` | 风向 | — |
| `windScale` | 风力等级 | — |
| `windSpeed` | 风速 | km/h 或 mile/h |
| `humidity` | 相对湿度 | % |
| `precip` | 过去1小时降水量 | mm |
| `pressure` | 大气压 | hPa |
| `vis` | 能见度 | km 或 mile |
| `cloud` | 云量 (可能为null) | % |
| `dew` | 露点温度 (可能为null) | °C 或 °F |

> **注意**：实时数据延迟 5-20 分钟。请以 `obsTime` 确认数据对应的准确时间。

#### 6.2.2 逐天天气预报 (Daily Forecast)

```
GET /v7/weather/{days}?location={location}&lang={lang}&unit={unit}
```

| 路径参数 | 说明 |
|----------|------|
| `{days}` | 预报天数：`3d`, `7d`, `10d`, `15d`, `30d` |

| 查询参数 | 必填 | 说明 |
|----------|------|------|
| `location` | ✅ | LocationID 或经纬度坐标 |
| `lang` | 否 | 多语言 |
| `unit` | 否 | 单位制 |

```bash
# 示例：获取北京3天预报
curl --compressed \
  -H 'Authorization: Bearer YOUR_JWT' \
  'https://your-host.qweatherapi.com/v7/weather/3d?location=101010100'
```

**主要响应字段 (每日含有白天/夜间两组数据)：**

| 字段 | 说明 |
|------|------|
| `fxDate` | 预报日期 |
| `sunrise`, `sunset` | 日出日落时间 (高纬度可能为null) |
| `moonrise`, `moonset` | 月出月落时间 (可能为null) |
| `moonPhase` | 月相名称 |
| `tempMax`, `tempMin` | 最高/最低温度 |
| `iconDay`, `textDay` | 白天天气图标和文字 |
| `iconNight`, `textNight` | 夜间天气图标和文字 |
| `windDirDay`, `windSpeedDay` | 白天风向风速 |
| `windDirNight`, `windSpeedNight` | 夜间风向风速 |
| `precip` | 日总降水量 (mm) |
| `uvIndex` | 紫外线指数 |
| `humidity`, `pressure`, `vis`, `cloud` | 湿度/气压/能见度/云量 |

#### 6.2.3 逐时天气预报 (Hourly Forecast)

```
GET /v7/weather/{hours}?location={location}&lang={lang}&unit={unit}
```

| 路径参数 | 说明 |
|----------|------|
| `{hours}` | 预报小时数：`24h`, `72h`, `168h` |

```bash
# 示例：获取北京24小时预报
curl --compressed \
  -H 'Authorization: Bearer YOUR_JWT' \
  'https://your-host.qweatherapi.com/v7/weather/24h?location=101010100'
```

**主要响应字段：**

| 字段 | 说明 |
|------|------|
| `fxTime` | 预报时间 (ISO8601) |
| `temp` | 温度 |
| `icon`, `text` | 天气图标和文字 |
| `windDir`, `windSpeed` | 风向风速 |
| `humidity` | 湿度 |
| `precip` | 逐时降水量 |
| `pop` | 降水概率 (可能为null) |
| `pressure`, `vis`, `cloud`, `dew` | 气压/能见度/云量/露点 |

#### 6.2.4 格点实时天气 (Grid Weather Real-time)

基于数值预报模型，空间分辨率 3-5km，使用 UTC+0 时区。

```
GET /v7/grid-weather/now?location={lon,lat}&lang={lang}&unit={unit}
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `location` | ✅ | 仅支持经纬度坐标 `lon,lat` |

#### 6.2.5 格点逐天预报 (Grid Weather Daily)

```
GET /v7/grid-weather/{days}?location={lon,lat}&lang={lang}&unit={unit}
```

| 路径参数 | 说明 |
|----------|------|
| `{days}` | `3d` 或 `7d` |

#### 6.2.6 格点逐时预报 (Grid Weather Hourly)

```
GET /v7/grid-weather/{hours}?location={lon,lat}&lang={lang}&unit={unit}
```

| 路径参数 | 说明 |
|----------|------|
| `{hours}` | `24h` 或 `72h` |

---

### 6.3 分钟级降水 (Minutely)

仅支持中国城市。获取未来 2 小时每 5 分钟的降水预报。

```
GET /v7/minutely/5m?location={lon,lat}&lang={lang}
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `location` | ✅ | 仅支持经纬度坐标 `lon,lat` (最多2位小数) |
| `lang` | 否 | 多语言 |

```bash
# 示例
curl --compressed \
  -H 'Authorization: Bearer YOUR_JWT' \
  'https://your-host.qweatherapi.com/v7/minutely/5m?location=116.41,39.92'
```

**主要响应字段：**

| 字段 | 说明 |
|------|------|
| `summary` | 降水描述 |
| `minutely[].fxTime` | 预报时间 |
| `minutely[].precip` | 5分钟累计降水量 (mm) |
| `minutely[].type` | 降水类型：`rain` 或 `snow` |

---

### 6.4 天气预警 (Warning)

#### 6.4.1 天气预警 v1 (Weather Alert)

全球官方发布的实时极端天气预警数据。

```
GET /weatheralert/v1/current/{latitude}/{longitude}?localTime={true|false}&lang={lang}
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `{latitude}` | ✅ | 纬度 (最多2位小数) |
| `{longitude}` | ✅ | 经度 (最多2位小数) |
| `localTime` | 否 | `true` 返回本地时间，`false` (默认) 返回 UTC |
| `lang` | 否 | 多语言 |

```bash
# 示例
curl --compressed \
  -H 'Authorization: Bearer YOUR_JWT' \
  'https://your-host.qweatherapi.com/weatheralert/v1/current/39.92/116.41'
```

**主要响应字段：**

| 字段 | 说明 |
|------|------|
| `id` | 预警唯一 ID |
| `senderName` | 发布机构 (可能为null) |
| `issuedTime` | 原始生成时间 |
| `eventType.name` | 预警事件类型名称 |
| `severity` | 严重等级 |
| `color.code` | 预警颜色代码 |
| `headline` | 简要描述/标题 |
| `description` | 详细描述 |
| `instruction` | 建议措施 (可能为null) |
| `effectiveTime`, `onsetTime`, `expireTime` | 生效/开始/过期时间 |

#### 6.4.2 天气预警 v7 (Severe Weather)

```
GET /v7/warning/now?location={location}&lang={lang}
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `location` | ✅ | LocationID |
| `lang` | 否 | 多语言 |

**v7 预警严重等级：**

| 等级 | 颜色 |
|------|------|
| `unknown` | White |
| `Minor` | Blue |
| `Moderate` | Yellow |
| `Severe` | Orange |
| `Extreme` | Red |

#### 6.4.3 预警城市列表

```
GET /v7/warning/list?range={range}&lang={lang}
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `range` | ✅ | 国家/地区代码 (目前仅支持中国及港澳台地区) |

---

### 6.5 生活指数 (Indices)

#### 6.5.1 天气指数预报

```
GET /v7/indices/{days}?location={location}&type={type}&lang={lang}
```

| 路径参数 | 说明 |
|----------|------|
| `{days}` | 预报天数：`1d` 或 `3d` |

| 查询参数 | 必填 | 说明 |
|----------|------|------|
| `location` | ✅ | LocationID 或经纬度坐标 |
| `type` | ✅ | 指数类型 ID，逗号分隔 |
| `lang` | 否 | 多语言 (仅支持中英文) |

**指数类型 ID (中国)：**

| ID | 指数 | ID | 指数 |
|----|------|----|------|
| 0 | 舒适度 | 8 | 紫外线 |
| 1 | 洗车 | 9 | 空气污染 |
| 2 | 穿衣 | 10 | 空调 |
| 3 | 感冒 | 11 | 过敏 |
| 4 | 运动 | 12 | 太阳镜 |
| 5 | 旅游 | 13 | 化妆 |
| 6 | 交通 | 14 | 阳光 |
| 7 | 钓鱼 | 15 | 防晒 |

```bash
# 示例：获取北京舒适度和穿衣指数
curl --compressed \
  -H 'Authorization: Bearer YOUR_JWT' \
  'https://your-host.qweatherapi.com/v7/indices/1d?location=101010100&type=0,2'
```

**主要响应字段：**

| 字段 | 说明 |
|------|------|
| `date` | 预报日期 |
| `type` | 指数类型 ID |
| `name` | 指数名称 |
| `level` | 指数等级 |
| `category` | 指数分类名 |
| `text` | 详细描述 (可能为null) |

---

### 6.6 空气质量 (Air Quality)

空间分辨率 1x1 km。

#### 6.6.1 实时空气质量 (v1)

```
GET /airquality/v1/current/{latitude}/{longitude}?lang={lang}
```

| 路径参数 | 必填 | 说明 |
|----------|------|------|
| `{latitude}` | ✅ | 纬度 |
| `{longitude}` | ✅ | 经度 |

**主要响应字段 (v1)：**

| 字段 | 说明 |
|------|------|
| `indexes[].code` | AQI 代码 |
| `indexes[].aqi` | AQI 数值 |
| `indexes[].level` | 等级 |
| `indexes[].category` | 分类 |
| `indexes[].color` | AQI 对应的 RGBA 颜色 |
| `indexes[].primaryPollutant` | 主要污染物信息 |
| `indexes[].health.effect` | 健康影响 |
| `indexes[].health.advice` | 健康建议 |
| `pollutants[]` | 各污染物浓度 (PM2.5, PM10, O3, SO2, CO, NO2) |
| `stations[]` | 关联监测站 ID 和名称 |

#### 6.6.2 逐时空气质量预报 (v1)

```
GET /airquality/v1/hourly/{latitude}/{longitude}?lang={lang}&localTime={true|false}
```

未来 24 小时逐时预报。

#### 6.6.3 逐天空气质量预报 (v1)

```
GET /airquality/v1/daily/{latitude}/{longitude}?lang={lang}&localTime={true|false}
```

未来 3 天逐天预报。

#### 6.6.4 监测站数据 (v1)

```
GET /airquality/v1/station/{LocationID}?lang={lang}
```

| 路径参数 | 必填 | 说明 |
|----------|------|------|
| `{LocationID}` | ✅ | 监测站 ID，如 `P58911` |

#### 6.6.5 实时空气质量 (v7, 旧版)

```
GET /v7/air/now?location={location}&lang={lang}
```

#### 6.6.6 逐天空气质量 (v7, 旧版)

```
GET /v7/air/5d?location={location}&lang={lang}
```

5 天逐天预报。

**v7 版响应字段：**

| 字段 | 说明 |
|------|------|
| `pubTime` | 数据发布时间 |
| `aqi` | AQI 值 |
| `level` | 等级名称 |
| `category` | 等级编号 |
| `primary` | 主要污染物 (等级为1时返回 `NA`) |
| `pm10`, `pm2p5`, `no2`, `so2`, `co`, `o3` | 各污染物浓度 |

---

### 6.7 时光机/历史数据 (Time Machine)

#### 6.7.1 历史天气

获取过去 10 天的天气历史数据（不包含当天）。

```
GET /v7/historical/weather?location={LocationID}&date={yyyyMMdd}&lang={lang}&unit={unit}
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `location` | ✅ | 仅支持 LocationID |
| `date` | ✅ | 日期 yyyyMMdd 格式，过去 10 天内 (不含今天) |
| `lang` | 否 | 多语言 |
| `unit` | 否 | 单位制 |

```bash
# 示例：获取北京昨天的天气
curl --compressed \
  -H 'Authorization: Bearer YOUR_JWT' \
  'https://your-host.qweatherapi.com/v7/historical/weather?location=101010100&date=20260604'
```

**响应包含 `weatherDaily` (逐天) 和 `weatherHourly` (逐时) 两部分。**

> 如需更早的历史数据 (2000年至今)，可联系 <sales@qweather.com> 获取历史再分析数据。

#### 6.7.2 历史空气质量

```
GET /v7/historical/air?location={LocationID}&date={yyyyMMdd}&lang={lang}
```

参数同上，日期范围也是过去 10 天内。

---

### 6.8 热带气旋 (Tropical Cyclone)

目前仅支持中国沿海区域 (`basin=NP`)。

#### 6.8.1 台风列表 (Storm List)

```
GET /v7/tropical/storm-list?basin={basin}&year={year}
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `basin` | ✅ | 海域，目前仅支持 `NP` (西北太平洋) |
| `year` | ✅ | 年份，支持当前年份和上一年 |

```bash
# 示例：获取2026年西北太平洋台风列表
curl --compressed \
  -H 'Authorization: Bearer YOUR_JWT' \
  'https://your-host.qweatherapi.com/v7/tropical/storm-list?basin=NP&year=2026'
```

#### 6.8.2 台风路径 (Storm Track)

```
GET /v7/tropical/storm-track?stormid={stormId}
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `stormid` | ✅ | 台风 ID，如 `NP2018` |

#### 6.8.3 台风预报 (Storm Forecast)

```
GET /v7/tropical/storm-forecast?stormid={stormId}
```

> 对于已停编的台风，返回数据为 NULL。请先通过台风列表确认活跃状态。

**热带气旋等级 (GBT 19201-2006)：**

| 等级 | 缩写 | 底层中心最大平均风速 (m/s) | 风力 (级) |
|------|------|---------------------------|-----------|
| 热带低压 | TD | 10.8-17.1 | 6-7 |
| 热带风暴 | TS | 17.2-24.4 | 8-9 |
| 强热带风暴 | STS | 24.5-32.6 | 10-11 |
| 台风 | TY | 32.7-41.4 | 12-13 |
| 强台风 | STY | 41.5-50.9 | 14-15 |
| 超强台风 | SuperTY | ≥51.0 | 16或以上 |

---

### 6.9 海洋 (Ocean)

#### 6.9.1 潮汐

全球潮汐数据，支持未来 10 天。

```
GET /v7/ocean/tide?location={tideStationId}&date={yyyyMMdd}
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `location` | ✅ | 潮汐站 LocationID (通过 POI Lookup 获取)，如 `P2951` |
| `date` | ✅ | 日期 yyyyMMdd，未来 10 天内 |

**响应包含 `tideTable` (潮汐表，高潮/低潮时间) 和 `tideHourly` (逐时潮高数据)。**

---

### 6.10 太阳辐射 (Solar Radiation)

#### 6.10.1 太阳辐射预报 (v1)

全球任意地点的太阳辐射预报，空间分辨率 1×1 km，15 分钟间隔，最长 60 小时。

```
GET /solarradiation/v1/forecast/{latitude}/{longitude}?hours={hours}&interval={interval}&extra={extra}&tilt={tilt}&azimuth={azimuth}&localTime={true|false}
```

| 路径参数 | 必填 | 说明 |
|----------|------|------|
| `{latitude}` | ✅ | 纬度 |
| `{longitude}` | ✅ | 经度 |

| 查询参数 | 必填 | 说明 |
|----------|------|------|
| `hours` | 否 | 预报小时数 1-60，默认 24 |
| `interval` | 否 | 数据间隔 `15`, `30`, `60` 分钟，默认 60 |
| `extra` | 否 | 附加信息：`weather` (基本天气) / `poa` (平面阵列，需同时传 `tilt` 和 `azimuth`) |
| `tilt` | 否* | 光伏系统倾斜角 0-90，整数。`extra=poa` 时必填 |
| `azimuth` | 否* | 光伏系统方位角 0-359，整数，0=北。`extra=poa` 时必填 |
| `localTime` | 否 | `true` 返回本地时间，默认 `false` (UTC) |

**主要响应字段：**

| 字段 | 说明 |
|------|------|
| `dni.value` | 直接法向辐照度 (W/m²) |
| `dhi.value` | 散射水平辐照度 (W/m²) |
| `ghi.value` | 全球水平辐照度 (W/m²) |
| `solarAngle.azimuth` | 太阳方位角 |
| `solarAngle.elevation` | 太阳高度角 |
| `weather.temperature` | 温度 (°C) |
| `weather.windSpeed` | 风速 (m/s) |
| `weather.humidity` | 相对湿度 (%) |
| `poa.global/direct/diffuse/reflected` | 平面阵列辐照度 (需 `extra=poa`) |

#### 6.10.2 太阳辐射逐时预报 (v7)

```
GET /v7/solar-radiation/{hours}?location={lon,lat}
```

| 路径参数 | 说明 |
|----------|------|
| `{hours}` | 24h |

---

### 6.11 天文学 (Astronomy)

#### 6.11.1 日出日落

```
GET /v7/astronomy/sun?location={location}&date={yyyyMMdd}
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `location` | ✅ | LocationID 或经纬度坐标 |
| `date` | ✅ | 日期 yyyyMMdd，最多未来 60 天 |

```bash
# 示例
curl --compressed \
  -H 'Authorization: Bearer YOUR_JWT' \
  'https://your-host.qweatherapi.com/v7/astronomy/sun?location=101010100&date=20260605'
```

#### 6.11.2 月出月落与月相

```
GET /v7/astronomy/moon?location={location}&date={yyyyMMdd}&lang={lang}
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `location` | ✅ | LocationID 或经纬度坐标 |
| `date` | ✅ | 日期 yyyyMMdd，最多未来 60 天 |
| `lang` | 否 | 多语言 |

**响应包含当天的月出月落时间以及逐时的月相数据 (包括月相值、名称、图标和照度)。**

#### 6.11.3 太阳高度角

```
GET /v7/astronomy/solar-elevation-angle?location={lon,lat}&date={yyyyMMdd}&time={HHmm}&tz={tz}&alt={alt}
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `location` | ✅ | 仅支持经纬度坐标 `lon,lat` |
| `date` | ✅ | 日期 yyyyMMdd |
| `time` | ✅ | 时间 HHmm (24小时制) |
| `tz` | ✅ | 时区偏移，如 `0800` 或 `-0530` |
| `alt` | ✅ | 海拔高度 (米) |

**响应字段：**

| 字段 | 说明 |
|------|------|
| `solarElevationAngle` | 太阳高度角 (度) |
| `solarAzimuthAngle` | 太阳方位角 (度，从正北顺时针) |
| `solarHour` | 太阳时 (HHmm) |
| `hourAngle` | 时角 |

---

### 6.12 控制台 (Console)

控制台 API 需要账户拥有者在控制台中为凭证开启相应权限。

#### 6.12.1 财务摘要

```
GET /finance/v1/summary
```

无参数。返回账户余额、费用明细、待付账单、储蓄计划和资源计划信息。

**权限要求：** 需在 [控制台 - 项目](https://console.qweather.com/project) → 选择凭证 → 勾选"允许访问财务摘要数据"。

#### 6.12.2 API 请求统计

```
GET /metrics/v1/stats?project={projectId}&credential={credentialId}
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `project` | 否 | 项目 ID (与 `credential` 互斥) |
| `credential` | 否 | 凭证 ID (与 `project` 互斥) |

**权限要求：** 需在控制台中为凭证开启对应的统计权限（总体统计/按项目/按凭证）。

---

## 7. 响应格式

### 通用响应结构

所有 API 响应均为 **JSON 格式**，并进行 **Gzip 压缩**。

### 公共字段

以下字段可能出现于多个 API 的响应中：

| 字段 | 说明 |
|------|------|
| `code` | HTTP 状态码 (v7 版 API 中为字符串，如 `"200"`) |
| `updateTime` | API 最后更新时间 (ISO8601 格式) |
| `fxLink` | 响应式天气页面链接，用于嵌入展示 |

### 元数据字段 (部分 API)

| 字段 | 说明 |
|------|------|
| `tag` | 数据唯一标签 |
| `expireTime` | 数据过期时间 |
| `attributions` / `sources` | 数据源标注 (必须随数据一同展示) |
| `zeroResult` | `true` 表示请求成功但无数据返回 |
| `refer.sources` | 原始数据源 (可能为null) |
| `refer.license` | 数据许可/版权 (可能为null) |

### 响应示例

```json
{
  "code": "200",
  "updateTime": "2013-12-30T01:45+08:00",
  "fxLink": "http://hfx.link/ae45",
  "now": {
    "obsTime": "2013-12-30T01:45+08:00",
    "temp": "21",
    "feelsLike": "23",
    "icon": "100",
    "text": "晴",
    "windDir": "西北风",
    "windScale": "3",
    "windSpeed": "15",
    "humidity": "40",
    "precip": "0.0",
    "pressure": "1020",
    "vis": "16",
    "cloud": "10",
    "dew": "5"
  },
  "refer": {
    "sources": ["Weather China"],
    "license": ["commercial license"]
  }
}
```

---

## 8. 错误码

### 错误码 v2 (推荐，逐步迁移中)

v2 使用 HTTP 状态码直接反映错误类型。

| HTTP 状态码 | 错误类型 | 说明 |
|-------------|----------|------|
| **400** | INVALID PARAMETER | 无效参数，`error.invalidParams` 列出具体无效参数 |
| **400** | MISSING PARAMETER | 缺少必填参数 |
| **400** | NO SUCH LOCATION | 查询的地点不存在或不支持 |
| **400** | DATA NOT AVAILABLE | 数据暂时不可用 |
| **401** | UNAUTHORIZED | 认证失败 (不会说明具体原因) |
| **403** | NO CREDIT | 余额/额度不足 |
| **403** | OVERDUE | 账单逾期 |
| **403** | SECURITY RESTRICTION | 违反安全限制 |
| **403** | INVALID HOST | API Host 无效 |
| **403** | ACCOUNT SUSPENSION | 账户已停用 |
| **403** | FORBIDDEN | 无权限请求 |
| **404** | NOT FOUND | 路径或路径参数错误 (无响应体) |
| **405** | METHOD NOT ALLOWED | 使用了 GET 以外的 HTTP 方法 (无响应体) |
| **429** | TOO MANY REQUESTS | 短时间内请求过多 (超出 QPM 限制) |
| **429** | OVER MONTHLY LIMIT | 超出月度订阅量限制 |
| **500** | UNKNOWN ERROR | 服务内部错误 |

**v2 响应格式：**

```json
{
  "error": {
    "status": 400,
    "type": "https://dev.qweather.com/docs/resource/error-code/#invalid-parameters",
    "title": "Invalid Parameters",
    "detail": "Invalid parameters, please check your request.",
    "invalidParams": ["lang"]
  }
}
```

### 错误码 v1 (旧版，逐步迁移中)

v1 始终返回 HTTP 200，通过响应体中的 `code` 字段表示状态。

| 响应 `code` | HTTP 状态码 | 说明 |
|-------------|-------------|------|
| `200` | 200 | 请求成功 |
| `204` | 200 | 请求成功，但该区域暂无数据 |
| `400` | 200 | 请求错误，可能参数错误或缺失 |
| `401` | 200 | 认证失败 |
| `402` | 200 | 请求次数超限或余额不足 |
| `403` | 200 | 无访问权限 |
| `404` | 200 | 查询的数据或区域不存在 |
| `429` | 200 | QPM 超限 |
| `500` | 200 | 无响应或超时 |

**v1 响应格式：**

```json
{
  "code": "401"
}
```

### v1 与 v2 对比

| | v1 | v2 |
|---|----|-----|
| HTTP 状态码 | 始终 200 | 根据错误响应不同的 HTTP 状态码 |
| 错误类型 | ❌ | ✅ |
| 错误描述 | ❌ | ✅ |
| 识别错误参数 | ❌ | ✅ |

---

## 9. 定价与配额

### 定价模式

按量计费 (Pay as you go)，用量越大单价越低。同时支持 [储蓄计划 (Savings Plans)](https://dev.qweather.com/en/docs/finance/savings-plans/) 获得额外折扣（最高 60%）。

### 类别一：天气及基础服务

包含 API：weather, minutely, warning, indices, air quality, time machine, geo, astronomy, console

| 月请求量 | 单价 (USD/次) |
|----------|---------------|
| 0 ~ 50,000 | **免费** |
| 50,001 ~ 950,000 | $0.0007 |
| 950,001 ~ 4,000,000 | $0.0005 |
| 4,000,001 ~ 5,000,000 | $0.00035 |
| 5,000,001 ~ 40,000,000 | $0.00015 |
| 40,000,001 ~ 50,000,000 | $0.0001 |
| 超过 100,000,000 | 联系商务 |

> 注意：逐天预报超过 7 天或逐时预报超过 24 小时不在此类别中。

### 类别二：台风与海洋

包含 API：tropical, ocean

| 月请求量 | 单价 (USD/次) |
|----------|---------------|
| 0 ~ 1,000,000 | $0.003 |
| 1,000,001 ~ 4,000,000 | $0.0025 |
| 4,000,001 ~ 5,000,000 | $0.0015 |
| 超过 10,000,000 | 联系商务 |

### 类别三：太阳辐射

包含 API：solar radiation

| 月请求量 | 单价 (USD/次) |
|----------|---------------|
| 0 ~ 100,000 | $0.30 |
| 100,001 ~ 400,000 | $0.20 |
| 超过 500,000 | 联系商务 |

### 免费订阅

- 每月前 50,000 次请求免费（类别一）
- 需遵守 **CC BY-SA 4.0** 许可证
- API Host 使用 `devapi.qweather.com`（即将停止服务）

---

## 10. 最佳实践

### 构建有效的 URL

- **特殊字符编码**：空格 → `%20`，中文 → `%E5%8C%97%E4%BA%AC`，逗号 → `%2C`
- **避免无效空白**：复制粘贴时注意去除 Token 前后的空格

### 错误处理与指数退避

当收到 `429` (QPM 超限) 或余额不足等错误时，使用指数退避：

```
t = b^c
```

- `t` = 下次请求等待时间
- `b` = 基数 (推荐 2)
- `c` = 错误次数

示例：第 1 次错误等 2 秒，第 2 次等 4 秒，第 3 次等 8 秒…直到成功。建议 `c` 最大不超过 10。

为避免多设备冲突，可在等待时间内加入随机数 (0 ~ 2^c - 1)。

### Gzip

务必开启 Gzip 压缩以减小流量、加速请求。

### 按需请求

仅在需要时请求数据，并设置合理的缓存时间。

### 安全

- 不要在网页中公开请求 URL 或 Token
- 使用 HTTPS + JWT 认证

---

## 11. SDK 信息

| SDK | 版本 | 日期 | 认证方式 |
|-----|------|------|----------|
| Android SDK | 5.2.2 | 2026-03-10 | JWT |
| iOS SDK | 5.2.1 | 2025-12-15 | JWT |

**Android SDK 下载：**
```
https://github.com/qwd/qweather-android-sdk/archive/refs/tags/5.2.2.zip
```
MD5: `e8424a1e2f160e8c49857734c0d373b4`

> SDK 5+ 版本仅支持 JWT 认证，不支持 API KEY。

---

## 快速开始总结

1. **注册账号** → [console.qweather.com](https://console.qweather.com)
2. **创建项目** → 获取 Project ID
3. **生成密钥** → 生成 Ed25519 密钥对，上传公钥获取 Credential ID
4. **查看 API Host** → 在控制台设置中获取专属域名
5. **生成 JWT** → 使用私钥签名，15 分钟过期
6. **发起请求**：

```bash
curl --compressed \
  -H 'Authorization: Bearer {YOUR_JWT}' \
  'https://{YOUR_API_HOST}/v7/weather/now?location=101010100'
```

---

> 本文档整理自 [QWeather 开发者文档](https://dev.qweather.com)，API 版本 v7.15。
>
> 最后更新：2026-06-05
