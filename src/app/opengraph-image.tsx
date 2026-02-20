import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'

export const alt = 'EventHub - Plan Events. Invite Friends. Share Memories.'
export const size = {
    width: 1200,
    height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
    return new ImageResponse(
        (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                background: 'white',
                color: 'black',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'black',
                        color: 'white',
                        borderRadius: '16px',
                        width: '100px',
                        height: '100px',
                        fontSize: '48px',
                        fontWeight: 'bold',
                        marginRight: '20px'
                    }}>
                        EH
                    </div>
                    <div style={{ fontSize: 80, fontWeight: 'bold', letterSpacing: '-0.02em' }}>EventHub</div>
                </div>

                <div style={{
                    fontSize: 48,
                    color: '#64748b',
                    fontWeight: 500,
                    letterSpacing: '-0.01em',
                }}>
                    Plan Events. Invite Friends. Share Memories.
                </div>
            </div>
        ),
        {
            ...size,
        }
    )
}
