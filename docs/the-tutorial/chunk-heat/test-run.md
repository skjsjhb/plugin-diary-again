---
sidebar_position: 6
---

# 5-6 运行和测试

胜利的曙光终于到来，只要在服务器上测试我们的插件没有问题，我们的区块过热插件就算完成了！所以，现在就赶快把插件放到 `plugins` 文件夹中，不过在启动服务器之前，最好先修改一下 `config.yml`：

```yaml
enabled: true   # 启用插件
mobs:
  - "minecraft:zombie"
  - "minecraft:creeper"
  - "minecraft:skeleton"
overheat: 20    # 将过热值适当减少
cooldown: 100   # 将冷却时间适当减少
```

我们打算用刷怪蛋来测试插件的效果，如果过热值很高或者冷却时间很长，测试起来都会比较麻烦，所以我们将它们适当减小。

现在就可以启动服务端，并通过客户端加入世界了！由于在我们的网站上插入视频或者动图实在是太困难了（受限于网络带宽），因此笔者没有在这里插入相关的图片，读者可以自行验证以下几点：

1. 使用刷怪蛋（僵尸、骷髅或者苦力怕）对着地面按右键，可以正常生成一些生物。
2. 当生成了一些生物后，就无法生成新的生物了。
3. 等待一段时间，又可以生成新的生物。
4. 在服务器控制台用 `op 你的名字` 将自己设置为服务器管理员。
5. 使用 `/chunk-heat disable` 禁用插件后，无论生成多少生物都没问题。
6. 使用 `/chunk-heat enable` 启用插件后，区块过热功能再次生效。
7. 在服务器控制台使用 `deop 你的名字` 撤销管理员权限。
8. 使用 `/chunk-heat disable`，将提示权限不够。

![No Permission](/img/contents/chunk-heat-perm.png)

*由于“什么都生成不出来”没办法通过图片展示，笔者在这里就偷个懒，只展示一下“权限不够”的结果，希望大家原谅（笑）。*

你也可以修改 `mobs` 的值，例如增加 `minecraft:sheep`，然后用羊刷怪蛋进行测试，区块过热功能应当正常运作。或者，如果你觉得“用刷怪蛋来测试实在是太作弊了！”，那也可以花点时间建造一个刷怪塔，亲自验证一下，这对于身为 Minecraft 高手的你来说应该是信手拈来。

---

那么，我们的区块过热插件就算正式完成了！虽然和实际使用的版本还是有些差距（例如启停插件成功后不会有任何提示），但总的来说是一个相当完整的作品，只要再稍加打磨，就可以用在真正的服务器上了！相比前面那些“中看不中用”的小玩具，还是很大的进步的。来看看我们都做了什么：

- 了解如何监听实体生成的事件。
- 使用 PDC 在 Minecraft 中的各种对象上附加数据。
- 利用时间标记的的方式，在事件处理函数中衡量时间。
- 利用会话 ID 技术判断存储的数据是否有效。
- 创建、使用和重复利用命名空间 ID。
- 使用变量提升来减少新对象的创建。
- 使用列表 `List` 、数组 `Array` 和无重复集合 `Set` 表示一组数据，并检测某个对象是否包含在其中。
- 处理命令的参数，并在命令执行失败时提示用户。
- 实时（但临时地）修改配置内容。

先前我们一直是在向玩家发送各种消息，现在我们终于踏出了访问世界数据（这次是实体和区块）的第一步，这是插件的一小步，却是学习编写增添游戏内容插件的一大步，为自己鼓个掌吧！如果还有什么不清楚的地方，也可以在 GitHub 上查看这个插件的 [源代码](https://github.com/skjsjhb/plugin-diary-again-projects/tree/main/chunk-heat) 来进一步了解。