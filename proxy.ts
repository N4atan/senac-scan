import { withAuth } from 'next-auth/middleware';

export default withAuth({
    pages: {
        signIn: '/auth'
    }
})


export const config = {
    matcher: [
        '/',
        '/busca/:path*',
        '/pendencias/:path*',
        '/leitor/:path*',
    ]
}