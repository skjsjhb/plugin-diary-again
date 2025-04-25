---
sidebar_position: 4
---

# 11-4 使用远程仓库

## 代码的服务器

Git 的所有提交都在你的电脑上存储，如果只是单人开发一个项目，这不算什么问题。不过，在团队开发中，或者在自己的多台设备之间切换时，该如何将 Git 的提交、分支什么的**共享**给其他人（其它机器）呢？

答案是使用由**代码托管（Code Hosting）** 平台提供的**远程仓库（Remote Repository）** 服务。所谓代码托管，就是允许你将代码存放在他们的服务器上，而远程仓库则是代码托管的一种形式，允许通过 Git 内置的命令进行**同步**，也就是上传和下载。

世界上的代码托管平台有很多，基于流行程度、价格、可靠性和隐私等方面的考量也有不同的选择，这里列出一部分：

- [GitHub](https://github.com)：世界上最流行的代码托管平台。

  > Most of the world's code lives on GitHub. Why not yours?

- [Codeberg](https://codeberg.org)：非商业化、注重隐私的代码托管平台。

  > Software development, but free!

- [Bitbucket](https://bitbucket.org)：Atlassian 运营的代码托管服务，能与其强大的 Jira 系统集成。

  > Code and CI/CD, powered by the Atlassian platform.

- [Azure DevOps](https://azure.microsoft.com/en-us/products/devops/)：Microsoft 提供的代码托管服务，能与 Azure 应用程序集成。

  > Plan smarter, collaborate better, and ship faster with a set of modern dev services.

这些平台在服务、性能、价格等方面都不尽相同，因此我们不向各位读者明确推荐其中的任何一个，读者可根据自身需要和项目实际情况选用。顺便一提，本书的所有代码（甚至包括本书中的文章）都是在 GitHub 上托管的，因为我们相信它是一个由大型工程师团队打造的可靠平台。

在本节中，我们会以 GitHub 为例，介绍使用远程仓库的方式。如果你打算使用其它平台，可能需要参考它们的说明进行操作。

## 在 GitHub 上创建仓库

要在 GitHub 上托管代码需要一个帐户，如果你还没有 GitHub 帐户，可以在 [注册页面](https://github.com/signup) 创建一个。当询问要使用什么样的计划（Plan）时，选择免费版（Free）就即可 —— 即使是像 Paper 这样的大型项目，免费版所包含的配额也完全足够使用。

:::warning 证明你是你

如果想让 GitHub 正确地将仓库中的提交与你的帐户关联起来，那么在注册帐户时，要使用先前在 Git 中提交时相同的邮箱（用户名可以任意）。

:::

注册并验证完成后，点按左上角的 GitHub 徽标回到个人主页，并单击绿色的 <kbd>New</kbd> 按钮，创建一个新仓库：

![GitHub New Repo](/img/s2/gh-new-repo.png)

只需要填写 `Repository name` 一栏中的仓库名称，其余的选项都保持默认就好。仓库的名称可以任意，不过由于是要给人看的，最好还是使用正式一些的名字（像图中那样的 `my-new-plugin` 就是个馊主意！）。

:::tip 术语库

**仓库（Repository）** 就是包含了项目文件以及 Git 提交、分支等信息的一个“箱子”。一般而言，在软件工程中，当讨论开发、测试和发行等工作时，我们使用“项目（Project）”一词，而当具体谈论代码和版本管理时，我们使用“仓库（Repository）”一词。一个大型项目可能有多个仓库，而一个仓库中的代码也可能被用在多个项目中。

:::

单击最下方右侧的 <kbd>Create repository</kbd> 按钮，即可创建一个新仓库。GitHub 会自动打开它，并显示该仓库的相关信息：

![GitHub Repo Init](/img/s2/gh-repo-init.png)

位于中间最醒目的是仓库的**地址**，将它复制下来，稍后将要把它填入 IDEA 中。

## 添加并推送远程仓库

既然我们已经创建好了 GitHub 仓库，那么是时候把上一节中的代码**推送（Push）** 上来了！

回到 IDEA 中，使用顶部菜单中的 <kbd>Git</kbd> 选单（可能需要先按一下屏幕左上角的菜单按钮），并点按 <kbd>Manage Remotes...</kbd> 按钮，以管理 Git 所用到的远程仓库。

在弹出的窗口中点按加号，添加一个远程仓库。IDEA 会自动为你填写名称（默认是 `origin`），我们只需要在 `URL` 一栏中填入仓库的地址，再单击两次 <kbd>OK</kbd>，将两个窗口都关闭即可。

![Git Remotes](/img/s2/git-remotes.png)

现在，远程仓库已经设置完毕，接下来只需要把本地存储的提交**推送到远程**就可以了！

使用顶部菜单中的 <kbd>Git</kbd> 选单，并点按 <kbd>Push...</kbd> 按钮，IDEA 会弹出一个窗口，显示将要推送的本地分支、远程仓库名称和远程分支信息，以及将要推送的提交列表：

![Git Push](/img/s2/git-push.png)

现在点按 <kbd>Push</kbd> 推送修改。由于这是我们第一次通过 IDEA 访问 GitHub，IDEA 会要求你登录：

![Git Auth](/img/s2/git-auth.png)

单击 <kbd>Log In via GitHub...</kbd>，并按提示继续操作即可。IDEA 会打开一个浏览器页面，允许你在那里登录 GitHub 帐户。此后，IDEA 会记住这次推送所使用的帐户，在该项目后续的推送中就不需要再次登录了。

验证完成后，IDEA 会自动开始推送，如果一切顺利，右下角会弹出这样的提示：

![Git Pushed](/img/s2/git-pushed.png)

并且你可以在 GitHub 上看到所推送的代码（需要刷新）：

![GitHub Code](/img/s2/gh-code.png)

这样我们的代码就在 GitHub 的某台服务器上存储完成了！其他人现在可以从这里获取和更新项目的代码，而且如果哪天我们的电脑坏掉了，还可以从这里恢复需要的数据。

## 拉取仓库更新

Git 除了可以推送到远程仓库，还可以从远程仓库**拉取（Pull）** 内容，也就是说，在我们把代码推送到远程仓库之后，如果团队中有人添加了新的提交，我们可以把相应的内容从远程仓库“下载”到本地的项目中！

*这样我们就实现了协作开发 —— 每当有人做了一些修改后，就把它推送到远程仓库，而其他人只需要拉取最新的代码，就可以同步项目的状态。*

现在来试试这一点吧！尽管我们现在还没有其它开发者，但 GitHub 允许我们直接在网站上修改项目的文件。刚好我们的项目中还没有 README 文件，GitHub 正在提醒我们创建一个：

![GitHub No README](/img/s2/gh-no-readme.png)

点按 <kbd>Add a README</kbd> 按钮，并在新的页面中随便填入一些内容，然后点击右上角的 <kbd>Commit changes...</kbd> 按钮来提交修改：

![GitHub Edit Online](/img/s2/gh-edit-online.png)

`Commit Message` 就是提交信息……我们之前做过这种事情了，对吧？虽然和 IDEA 的界面不太相同，但操作原理非常相似。编辑好提交信息后，点按 <kbd>Commit changes</kbd> 按钮，GitHub 就会创建一个新提交，包含刚刚创建的 `README.md` 文件。

现在文件创建好了，远程仓库中也多了一个新的提交，那么是时候把它**拉取到本地**了！

回到 IDEA 中，这次仍然要使用顶部的 <kbd>Git</kbd> 菜单，并点按 <kbd>Pull</kbd> 按钮，在弹出的窗口中确认所使用的远程仓库名称（应为 `origin`）和分支（应为 `main`），随后点击 <kbd>OK</kbd> 按钮，稍等一会儿，右下角应当弹出提示：

![Git Pull](/img/s2/gh-pull.png)

现在查看项目中的文件，刚才在 GitHub 上添加的 `README.md` 应该出现到 IDEA 的文件列表中，这样我们就成功把 GitHub 上的远程仓库内容同步到我们的电脑上。

---

只要掌握了使用代码托管平台和远程仓库，理论上来说，几乎所有个人和小型团队维护的项目就都可以通过这种模式（推送和拉取）进行版本管理了。我们只需要创建提交，并将其推送，由其他开发者拉取，就可以实现代码的同步。除此之外，如果碰到什么问题，我们大不了还可以回退修改，从最近一次成功的地方再来。

不过，这种简单的推送和拉取，在应用到更大型的项目中会遇到不少麻烦，如果团队的人数继续增加，我们就必须用到 Git 的更高级功能。遗憾的是，Git 所包含的知识实在是太多太多了，仅仅是关于 Git 的用法就能写上好几本书，要把它们全部概括到本书中介绍是不可能的。本书所介绍的 Git 知识，对于大多数中小型插件项目来说，已经完全足够了。大家如果希望进一步了解关于 Git 的进阶用法，可以去看看 [Atlassian 出品的 Git 使用指南](https://www.atlassian.com/git/tutorials)，其中有对 Git 中常用命令的详细说明。
