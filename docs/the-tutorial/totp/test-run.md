---
sidebar_position: 6
---

# 8-6 运行和测试

## 安装 TOTP 验证器

为了测试我们的插件，我们需要一个支持 TOTP 的应用。笔者在这里推荐 Google Authenticator，这是由 Google 开发的 TOTP 验证程序，界面简洁而且容易操作。你可以从 [Google Play 商店](https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2) 或者 [App Store](https://apps.apple.com/us/app/google-authenticator/id388497605) 下载它。

*如果无法访问 Google Play 商店，也可以从设备上的“应用市场”或者类似的程序安装。*

如果不打算使用手机或平板，那也可以在电脑上安装 TOTP 验证器：

- Microsoft Windows：可以从 Microsoft Store 下载 [Authenticator App](https://apps.microsoft.com/detail/9N6GL0BVKPHN)。
- Apple macOS：可以从 App Store 下载 [2FA: TOTP Authenticator](https://apps.apple.com/us/app/2fa-totp-authenticator/id1219919851)。
- GNU/Linux：可以使用 [OTPClient](https://github.com/paolostivanin/OTPClient)。

## 测试插件

构建并安装插件，然后启动并加入服务器。先不急着使用 `/totp` 进行启用，让我们先试试能否执行其它命令（例如 `/help`）：

![TOTP Rejection](/img/contents/totp-1.png)

看上去命令拦截在正常工作。那么好，接下来就通过 `/totp` 创建新密钥：

![TOTP QRCode](/img/contents/totp-2.png)

:::danger 等一下！

此处展示二维码是出于教学目的的演示，TOTP 的二维码包含密钥信息，在扫描后就应该立即关闭，绝不要分享它！

:::

如果你在使用手机，那么打开 App，然后通过相机扫描屏幕上的二维码。如果你打算在电脑上完成验证，那么请使用验证器的截图功能，并截取二维码进行导入。

*如果扫描失败，请尝试将游戏窗口放大一些。另外，如果验证器要求你填写“网站信息”，那么可以随意填写，不会影响验证码的生成。*

以下是在 Windows 上的 Authenticator App 中导入后的结果：

![TOTP App](/img/contents/totp-app.png)

接下来执行命令并填入生成的验证码，例如 `/totp 458660`（你的验证码会有所不同）：

![TOTP OK](/img/contents/totp-3.png)

认证成功，非常好！现在试试执行其它的命令，应该不会再被插件拦截。

退出并重新加入服务器，然后输入错误的 TOTP 验证码，应当会被踢出服务器：

![TOTP Failed](/img/contents/totp-4.png)

这样我们的插件就测试完毕，所有功能都正常运作，可喜可贺！

---

终于，我们再一次将服务器从被人彻底毁坏的命运中拯救出来。我们没有使用到太多的新东西，不过还是有几点值得在这里列出：

- 了解 TOTP 如何增强帐户的安全性。
- 在配置文件以外的 YAML 中存储数据。
- 在执行命令前获取事件，并进行预处理。
- 设计和编写较为复杂的命令处理程序。

插件的功能虽然不多，但实现起来还是有些复杂的，如果大家有任何疑问，一定要去看看项目的 [源代码](https://github.com/skjsjhb/plugin-diary-again-projects/tree/main/totp)。

服务器安全一直以来都是备受瞩目的话题。商业利益、情感纠葛、意识斗争以及对权力的渴望，支配着一代又一代的黑客和运维人员在不算大的服务器上争来打去。时至今日，世上仍有许多服务器系统处于焦灼的战火之中，仅 2024 年一年就有超过五万个漏洞和后门被发现，可检测到的 DDoS 攻击超过 2130 万次，其中最大的规模达 5.6 Tbps（相当于一秒下载近 10000 份 Minecraft）。数以亿计的资金被投入这场不见硝烟的战争，而因此损失的算力 —— 那些本来可以用来运行丰富多彩的游戏的算力 —— 更是无从统计。可悲的是，我们甚至无法为如此惨重的损失找到任何正当的理由。

> And her ways are ways of gentleness  
> And all her paths are peace
>
> — *I Vow To Thee My Country*