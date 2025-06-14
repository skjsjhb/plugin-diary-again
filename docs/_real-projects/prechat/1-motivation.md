---
sidebar_position: 1
---

# PC-1 文字美学

## 白蚂蚁的飞行式

没人喜欢看到这个样子的聊天栏消息：

![Plain Message](/img/s3/plain-msg.png)

如果能加上一点颜色，就会好很多：

![Colored Message](/img/s3/colored-msg.png)

但是我们还可以通过添加前后缀，让插件的消息看起来更“正规”：

![Styled Message](/img/s3/styled-msg.png)

是不是看上去就有点“专业作品”的味道了（笑）？这就是**编排文字样式（Styling）** 的意义，能让文本更好看，而且读起来也更清晰，就和本书中的代码高亮一样：

```
// 没有高亮的
fun main() {
    URI("https://example.com").toURL().use {
        it.copyTo(System.out)
    }
}
```


```kotlin
// 带有高亮的
fun main() {
    URI("https://example.com").toURL().use {
        it.copyTo(System.out)
    }
}
```

*你会发现本书中的 `行内代码` 几乎只用来描述标识符，或者非常短的表达式，这也是出于同样的理由 —— 因为没有高亮而又比几个字符更长的代码确实很难读。*

## 文本组件技术

这些文字是彩色的，当然不是因为笔者用眼睛瞪着它们，它们就会自动变成彩色的，我们需要通过代码**构造**出一条这样的消息。做到这一点的正是我们熟悉的老朋友 —— Adventure！这次用到的是 Adventure API 的文本组件部分，也许你对“组件”这个名字并不熟悉，不过不要紧，你肯定还记得这样的代码：

```kotlin
Component.text("嗨，我是 Adventure API！")
```

之前我们总是说“使用 `Component.text`”构造一条消息，但实际上，`Component` 除了可以构造消息文本，还可以对它们上色、调整形态、设置动作等。Adventure 把这些都封装成了简单易用的方法，就像这样：

```kotlin

```



