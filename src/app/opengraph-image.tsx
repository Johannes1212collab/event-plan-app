import { ImageResponse } from 'next/og'

export const alt = 'EventHub'
export const size = {
    width: 1200,
    height: 630,
}
export const contentType = 'image/png'

export default function Image() {
    return new ImageResponse(
        (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                background: 'white',
                color: 'black',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', margin: '0 40px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'black',
                        color: 'white',
                        borderRadius: '24px',
                        width: '160px',
                        height: '160px',
                        fontSize: '80px',
                        fontWeight: 'bold',
                        marginRight: '40px'
                    }}>
                        EH
                    </div>
                    <div style={{ fontSize: '100px', fontWeight: 'bold' }}>EventHub</div>
                </div>
            </div>
        ),
        {
            ...size,
        }
    )
}
