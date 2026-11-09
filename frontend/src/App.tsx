import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SiteProvider } from './store'
import { PublicLayout } from './components/PublicLayout'
import { AdminLayout, RequireAuth } from './components/AdminLayout'

import { Home } from './pages/Home'
import { Galleries } from './pages/Galleries'
import { GalleryDetail } from './pages/GalleryDetail'
import { Events } from './pages/Events'
import { Posts } from './pages/Posts'
import { PostDetail } from './pages/PostDetail'
import { PageView } from './pages/PageView'
import { Search } from './pages/Search'
import { NotFound } from './pages/NotFound'

import { Login } from './admin/Login'
import { Dashboard } from './admin/Dashboard'
import { Upload } from './admin/Upload'
import { GalleriesAdmin } from './admin/GalleriesAdmin'
import { GalleryEdit } from './admin/GalleryEdit'
import { EventsAdmin } from './admin/EventsAdmin'
import { PostsAdmin } from './admin/PostsAdmin'
import { PostEdit } from './admin/PostEdit'
import { PagesAdmin } from './admin/PagesAdmin'
import { Settings } from './admin/Settings'
import { Design } from './admin/Design'
import { Mcp } from './admin/Mcp'

export default function App() {
  return (
    <SiteProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/galleries" element={<Galleries />} />
            <Route path="/gallery/:slug" element={<GalleryDetail />} />
            <Route path="/events" element={<Events />} />
            <Route path="/posts" element={<Posts />} />
            <Route path="/post/:slug" element={<PostDetail />} />
            <Route path="/page/:slug" element={<PageView />} />
            <Route path="/search" element={<Search />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="/admin/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="upload" element={<Upload />} />
            <Route path="galleries" element={<GalleriesAdmin />} />
            <Route path="galleries/:id" element={<GalleryEdit />} />
            <Route path="events" element={<EventsAdmin />} />
            <Route path="posts" element={<PostsAdmin />} />
            <Route path="posts/:id" element={<PostEdit />} />
            <Route path="pages" element={<PagesAdmin />} />
            <Route path="settings" element={<Settings />} />
            <Route path="design" element={<Design />} />
            <Route path="mcp" element={<Mcp />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SiteProvider>
  )
}
