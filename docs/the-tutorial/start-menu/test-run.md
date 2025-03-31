---
sidebar_position: 9
---

# 4-7 运行和测试

构建插件，并将它安装到 `plugins` 目录中，然后启动服务器与客户端，并通过 `localhost` 或 `127.0.0.1` 加入本地服务器。

在加入游戏后，你就可以在聊天框输入 `/menu` 来打开菜单：

![.](/img/contents/start-menu-2.png)

然后你可以逐个测试功能，首先是重新部署：

![.](/img/contents/start-menu-3.png)

快速起飞：

![.](/img/contents/start-menu-4.png)

查询延迟：

![.](/img/contents/start-menu-5.png)

执行自定义命令（`say Ciallo～(∠・ω< )⌒☆`）：

![.](/img/contents/start-menu-6.png)

你也可以尝试修改 `liftoff.velocity` 以及 `command` 的值，并在 `/reload confirm` 之后查看效果，这里就不单独进行演示了。

---

这一章真长！而且项目本身无论是编码方面还是理解难度都上升了不少，不过相信各位读者在进一步掌握了 Kotlin 的高阶知识，并学习了如何与玩家交互之后，将为后续开发更为复杂的插件项目打下基础。来看看我们都做了什么：

- 使用物品栏作为菜单，物品作为按钮交互。
- 用物品栏所有者区分是否是插件的物品栏。
- 监听 `InventoryClickEvent`，并根据被点击物品信息执行操作。
- 通过取消事件来阻止它的默认行为，例如将物品拿走。
- 在 `plugin.yml` 中注册命令。
- 通过设置命令处理函数来处理命令。

做得不错！这一章的内容这么多，或许读者对于某些地方还有疑问，那么可以在 GitHub 上查看本项目的 [源代码](https://github.com/skjsjhb/plugin-diary-again-projects/tree/main/start-menu)。