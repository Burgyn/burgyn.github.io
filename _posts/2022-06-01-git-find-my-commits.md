---
layout: post
title: Git find my commits
tags: []
author: Miňo Martiniak
comments: true
---

> I keep this to myself here 😉

If you ever need to search for your commits, this command may come in handy:

```bash
git log --format="commit %H%nAuthor: %an %ae%nDate: %ad%nTitle: %s%n" --date=iso --since="2022-01-01" --author={YOUR_NAME/EMAIL}
```

🙏 Thanks to [@Satano](https://github.com/satano).