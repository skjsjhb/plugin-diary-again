---
sidebar_position: 2
---

# 3-2 扩充知识库

下面将向你介绍如何连接全球 Bukkit 开发者的共享大脑。

## 什么是文档

软件开发者在制作完软件后，通常都会向用户提供一些资料，告诉用户如何使用他们的软件。这些资料就被称作**文档（Documentation）**。Paper 作为最流行的 Minecraft （插件 ~~，不过这个限定词可能不是很必要~~）服务端，拥有极为翔实的文档。不仅包括如何运行和管理服务器，也为我们这些插件开发者提供了使用 Paper 的 API（也就是前面提到的“Bukkit（和 Paper）做好的函数”）的资料。

:::tip 术语库

**应用程序接口（Application Programming Interface，API）** 指的是某个或某些程序为开发其它程序提供的支持，以及程序之间交互的方法。在 Kotlin（和 Java）中，API 通常是指这些程序写好的类、函数、变量等。在插件开发中，程序之间的交互指的就是插件与 Bukkit（和 Paper）之间的交互。

:::

Paper 的资料可以在 [Paper 的官方网站](https://docs.papermc.io/paper) 上找到（绝大多数其它软件也是如此）。

## Javadoc

Java（和 Kotlin）程序中涉及的函数、变量、对象等可能很复杂，函数可能包含一系列参数以及它们的类型，对象要列出它们包含的属性和方法等。为了有条理地描述这些信息，大多数 Java 程序（和一些 Kotlin 程序）使用一种名为 Javadoc 的工具生成文档。Paper 同样拥有 Javadoc，可以通过 [这个链接](https://jd.papermc.io/paper/1.21.4/) 访问。不过遗憾的是，文档是英文写的，因为开发 Paper 的人主要是外国人（笑）。

Javadoc 提供了内置的搜索功能，只需要在右上角的搜索栏内键入要检索的内容，例如 `PlayerJoinEvent`：

![Javadoc Search](/img/contents/jd-1.png)

然后只需要单击就可以查看 `PlayerJoinEvent` 的各种信息，包括属性和方法，以及它们的使用说明。

## 搜索技巧

Javadoc 在已经知道要使用的类或函数，想要查找它们的**具体用法**时是非常有用的，可是如果我们不知道呢？比如我们现在想要监听玩家退出服务器的事件，但我们不知道它的名字，该如何处理？有四种可行的方法：

- 使用各种搜索引擎的站内搜索功能。

  Javadoc 自身的搜索能力比较差，虽然像玩家退出之类的事件肯定包含在某个页面中，但它常常搜索不到，使用更专业的搜索引擎就能解决这个问题。
  
  大多数搜索引擎都使用 `site:网站 搜索内容` 的格式进行站内搜索，前面提到的 Google、Yandex 和 Bing 都支持这种方式。所以要查找玩家退出的事件，只需要在搜索栏中键入 `site:https://jd.papermc.io/paper/1.21.4/ player quit` 就可以找到。

  以下是 Google 站内搜索的结果，第一个搜索结果就是我们想找的页面：

  ![Google Search](/img/contents/google-site.png)
  
- 根据经验和符号命名方式来进行推断。

  这种方式虽然看上去不怎么靠谱，但实际上是开发中最常用的方法，我们已经知道玩家加入服务器的事件是 `PlayerJoinEvent`，所以玩家退出的事件的名字应该类似于 `PlayerQuitEvent`、`PlayerLeaveEvent` 或者 `PlayerDisconnectEvent` 之类，多试几次就能找到。
  
  除了在 Javadoc 上搜索，你也可以直接在 IDEA 中按两下 <kbd>Shift</kbd>，选择 <kbd>Symbols</kbd>，再键入要搜索的内容，可以直接搜索 Paper 提供的资源（可能没有文档）：

  ![IDEA Search](/img/contents/idea-search.png)

- 让 AI 大语言模型代劳。

  这算是一种新兴的方式，大语言模型目前发展是如此迅速，使用它们来查找资料会方便很多，你只需要在它们的聊天栏中输入诸如“在 Paper 中，玩家退出服务器的事件是什么”这样的提问，AI 就能提供相应的信息。
  
  **但是，大语言模型也有致命的问题。** 它们的资料常常不是实时更新的，而且给出的回答也可能不完全正确。软件开发是一个严谨的领域，代码上非常微小的错误也可能会造成严重的后果，所以在阅读 AI 的回答时必须非常小心，最好是和 Javadoc 中的权威内容进行核对。

  不带任何商业利益、政治倾向或者学术观点地来说，[ChatGPT](https://chatgpt.com) 和 [Google Gemini](https://gemini.google.com/app) 是最合适的选择，但如果因为网络问题无法访问，那么也可以试试 [Mistral AI Le Chat](https://chat.mistral.ai/chat)、[DeepSeek Chat](https://www.deepseek.com) 等。

  以下是 Mistral AI Le Chat 对于此问题的解答，注意在与 AI 交互时需要提供足够的信息，就像我那样：

  ![Mistral AI](/img/contents/mistral.png)

- 在论坛等处发帖求助。

  这算是最后的方法，如果查遍搜索引擎也问了 AI，但始终找不到该怎么做，那么就是时候问问同行了。不提前搜索任何东西就直接到处问，在社区会被当作是伸手党批评，但若你已经试过了，还是有问题要问，那就不要犹豫，大胆提问。本书发布在的 [MCBBS 纪念版](https://www.mcbbs.co) 是一个不错的地方，另外你也可以在很多其它网站获得类似的支持。

---

不管是通过什么样的方法，要点其实只有一个：**尝试自己解决问题**。本书虽然涵盖开发插件常用的功能，但不可能面面俱到，因此自行搜索和获取知识的能力将始终与你的插件开发旅程，以及任何 Minecraft 相关或无关的开发过程相伴。