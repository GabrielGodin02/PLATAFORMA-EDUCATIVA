import bcrypt from 'bcryptjs';

const HashGenerator = () => {
    const hash = bcrypt.hashSync('admin123', 10);
    console.log('Hash:', hash);
    return (
        <div style={{ padding: 20 }}>
            <h2>Copia este hash:</h2>
            <p style={{ wordBreak: 'break-all', background: '#f0f0f0', padding: 10, fontSize: 12 }}>
                {hash}
            </p>
        </div>
    );
};

export default HashGenerator;