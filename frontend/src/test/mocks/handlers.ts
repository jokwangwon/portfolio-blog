import { http, HttpResponse } from "msw";

const BASE_URL = "/api/portal";

export const mockPost = {
  id: 1,
  title: "Test Post",
  content: "Test content",
  excerpt: "Test excerpt",
  status: "PUBLISHED",
  viewCount: 10,
  likeCount: 5,
  author: { username: "testuser", role: "USER" },
  category: { id: 1, name: "Tech" },
  tags: [{ id: 1, name: "react" }],
  createdAt: "2026-03-31T00:00:00",
  updatedAt: "2026-03-31T00:00:00",
  publishedAt: "2026-03-31T00:00:00",
};

export const mockPageResponse = {
  content: [mockPost],
  totalElements: 1,
  totalPages: 1,
  number: 0,
  size: 10,
  empty: false,
  first: true,
  last: true,
};

export const mockComment = {
  id: 1,
  content: "Test comment",
  deleted: false,
  author: { username: "testuser", role: "USER" },
  replies: [],
  createdAt: "2026-03-31T00:00:00",
  updatedAt: "2026-03-31T00:00:00",
};

export const handlers = [
  http.get(`${BASE_URL}/posts`, () => {
    return HttpResponse.json(mockPageResponse);
  }),

  http.get(`${BASE_URL}/posts/search`, () => {
    return HttpResponse.json(mockPageResponse);
  }),

  http.get(`${BASE_URL}/posts/:id`, ({ params }) => {
    return HttpResponse.json({ ...mockPost, id: Number(params.id) });
  }),

  http.post(`${BASE_URL}/posts`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...mockPost, ...body, id: 2 }, { status: 201 });
  }),

  http.put(`${BASE_URL}/posts/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...mockPost, ...body, id: Number(params.id) });
  }),

  http.delete(`${BASE_URL}/posts/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${BASE_URL}/posts/:id/like`, ({ params }) => {
    return HttpResponse.json({ liked: true, postId: Number(params.id) });
  }),

  http.delete(`${BASE_URL}/posts/:id/like`, ({ params }) => {
    return HttpResponse.json({ liked: false, postId: Number(params.id) });
  }),

  http.get(`${BASE_URL}/categories`, () => {
    return HttpResponse.json([{ id: 1, name: "Tech" }]);
  }),

  http.get(`${BASE_URL}/tags`, () => {
    return HttpResponse.json([{ id: 1, name: "react" }]);
  }),

  http.get(`${BASE_URL}/posts/:postId/comments`, () => {
    return HttpResponse.json({
      content: [mockComment],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
      empty: false,
      first: true,
      last: true,
    });
  }),

  http.post(`${BASE_URL}/posts/:postId/comments`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { ...mockComment, ...body, id: 2 },
      { status: 201 }
    );
  }),

  http.put(`${BASE_URL}/posts/:postId/comments/:commentId`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...mockComment, ...body });
  }),

  http.delete(`${BASE_URL}/posts/:postId/comments/:commentId`, () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
