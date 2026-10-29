import { site } from './site';
import type { Post } from './posts';

// jekyll-paginate layout: page 1 at /, then /page2, /page3, ...
export function paginate(posts: Post[], page: number) {
  const pages = Math.ceil(posts.length / site.paginate);
  const path = (n: number) => (n === 1 ? '/' : `/page${n}`);
  return {
    posts: posts.slice((page - 1) * site.paginate, page * site.paginate),
    pages,
    prev: page > 1 ? path(page - 1) : undefined,
    next: page < pages ? path(page + 1) : undefined,
  };
}
