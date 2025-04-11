---
sidebar_position: 5
---

# 8-5 密钥生成与验证

接下来要做的就是处理 `/totp` 命令，验证密钥和创建密钥都在这里完成。

## 设置命令处理函数

和先前一样，我们在 `TOTPListener` 的构造函数中设置命令处理函数：

```kotlin
init {
    Bukkit.getPluginCommand("totp")?.setExecutor { sender, command, label, args ->
        // 只有玩家才需要 TOTP 验证
        if (sender is Player) {
            // ...
        }

        true    // 命令返回值
    }
}
```

第一步要做的是判断玩家有没有提供验证码，也就是玩家到底想要**启用** TOTP 还是通过 TOTP 进行**验证**。这很容易做到，我们只要看看命令的第一个参数是什么：

```kotlin
val code = args.firstOrNull()

if (code == null) {
    // 试图启用 TOTP
} else {
    // 试图验证 TOTP
}
```

`firstOrNull` 方法获取命令的第一个参数，但如果命令没有参数（例如 `/totp`），那么它返回 `null`。

## 验证 TOTP

我们先来完成比较简单的部分，也就是**检查玩家的验证码是否有效**：

```kotlin
val secret = secretsData.getString(sender.uniqueId.toString())

if (secret == null) {
    sender.sendMessage(Component.text("若要启用 TOTP，请使用不含参数的 /totp 命令。"))
} else {
    val verifier = DefaultCodeVerifier(DefaultCodeGenerator(), SystemTimeProvider())
    if (verifier.isValidCode(secret, code)) {
        authenticatedPlayers.add(sender.uniqueId)
        sender.sendMessage(Component.text("TOTP 认证成功。"))
    } else {
        sender.kick(Component.text("对不起，请重试。"))
    }
}
```

我们通过 `getString` 从 `secretsData` 中查找玩家的密钥。如果没有这个密钥，那么玩家还没有启用 TOTP，自然也就无从验证，我们于是提示玩家操作错误。

如果密钥存在，我们就使用 Java TOTP 提供的 `DefaultCodeVerifier` 检查验证码的有效性：

```kotlin
val verifier = DefaultCodeVerifier(DefaultCodeGenerator(), SystemTimeProvider())
if (verifier.isValidCode(secret, code)) {
    // 验证码有效
} else {
    // 验证码无效
}
```

当验证码有效时，我们可以将玩家**加入白名单**，并告知玩家这一点。反之，如果验证码无效，我们就使用 `kick` 方法将玩家**踢出服务器**。`kick` 方法的参数允许我们自定义踢出玩家的理由。

## 启用 TOTP

如果玩家没有提供参数，那我们就需要为当前玩家**启用 TOTP**。

首先，我们要确认玩家还没有启用 TOTP，也就是 `secretsData` 中不包含玩家的 UUID：

```kotlin
if (secretsData.contains(sender.uniqueId.toString())) {
    sender.sendMessage(Component.text("请提供 TOTP 验证码进行验证。"))
} else {
    // 创建并添加密钥，显示二维码
}
```

由于 YAML 中的键均为字符串，因此要在 UUID 后额外增加 `toString()` 调用，才能用于查找。

创建密钥并显示二维码的代码如下：

```kotlin
val secret = DefaultSecretGenerator().generate()    // 生成新密钥
secretsData.set(sender.uniqueId.toString(), secret) // 登记密钥

val image = createImageForSecret(secret, sender.name, issuer)   // 生成二维码图片
val item = createImageMapItem(image)                // 生成包含图片的地图
sender.inventory.addItem(item)                      // 将地图加入玩家物品栏

sender.sendMessage(Component.text("包含 TOTP 二维码的地图已加入你的物品栏，请使用验证器扫描其中的二维码。"))                    
```

我们使用 `DefaultSecretGenerator` 生成一个**新密钥**，并在 `secretsData` 中登记它。`set` 方法用于改变 YAML 中指定键的内容。

`createImageForSecret` 和 `createImageMapItem` 是事先编写好的两个函数，分别用于**生成图片**以及**创建地图**。遗憾的是，这两个函数所使用到的功能已经超出了第一话的范畴，因此我们将这部分代码折叠了。读者只需要知道“哦，有办法生成图片并将它画在地图上”就足够了，具体的原理将在本书的后面部分介绍。

<details>
<summary>查看完整代码</summary>

```kotlin
private fun createImageForSecret(secret: String, name: String, issuer: String): Image {
    val qrCode = QrData.Builder()
        .secret(secret)
        .label(name)
        .issuer(issuer)
        .build()

    val imgData = ZxingPngQrGenerator().generate(qrCode)
    val image =
        ImageIO.read(ByteArrayInputStream(imgData)).getScaledInstance(128, 128, Image.SCALE_FAST)

    return image
}

private fun createImageMapItem(img: Image): ItemStack {
    val item = ItemStack(Material.FILLED_MAP)
    item.editMeta {
        it.customName(Component.text("TOTP 验证码"))
        val mv = Bukkit.createMap(Bukkit.getWorlds().first())
        (it as MapMeta).run {
            mapView = mv
            mapView!!.renderers.forEach { mapView!!.removeRenderer(it) }
            mapView!!.addRenderer(
                object : MapRenderer() {
                    override fun render(map: MapView, canvas: MapCanvas, player: Player) {
                        canvas.drawImage(0, 0, img)
                    }
                }
            )
        }
    }

    return item
}
```
</details>

当创建了物品后，我们就通过 `inventory.addItem` 将它加入玩家的物品栏。玩家只要将地图拿在手上，就可以扫描其中的二维码了！

## 注册事件与命令

最后，我们要在 `Main` 中注册事件，这同时也为我们的 `/totp` 设置了命令处理函数。完成后的 `Main.kt` 如下：

```kotlin
class Main : JavaPlugin() {
    private var listener: TOTPListener? = null

    override fun onEnable() {
        saveDefaultConfig()
        if (config.getBoolean("enabled")) {
            server.pluginManager.registerEvents(TOTPListener(this), this)
        }
    }

    override fun onDisable() {
        listener?.saveSecrets()
    }
}
```

---

这就 OK 了！是不是感觉做的事情有些少到不可思议？这个插件几乎没有什么新内容，不过是多了对命令参数的处理。看似新增的密钥存取，其实也不过就是对换了个名字的“配置文件”进行读写。密钥的生成和验证，通过使用依赖库，也变成了简单的函数调用。最为困难的地图生成，则由笔者糊弄过去了（笑）。

这个插件的核心其实是命令处理部分的**逻辑**，通过参数推测玩家的意图，何时提取和生成密钥，判断玩家的操作是否合理，并发送相应的提示信息。读者应当了解，即使是如此简单的“输入验证码以验证”功能，背后也是需要精心设计的逻辑支撑的。