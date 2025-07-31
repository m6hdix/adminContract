# Mahdi Token (MHD)

A comprehensive TON blockchain token implementation with fee mechanism, admin controls, and a modern web interface.

## Overview

Mahdi Token (MHD) is a fungible token built on the TON blockchain that implements:
- **Standard TON Token Compliance**: Follows TON Token Standard
- **Fee Mechanism**: Configurable transfer fees (default 0.1%) sent to admin wallet
- **Admin Controls**: Complete admin management system
- **User Management**: Freeze/unfreeze specific users
- **Token Management**: Mint and burn functionality
- **Modern UI**: Responsive admin panel with Tailwind CSS

## Features

### Token Specifications
- **Name**: Mahdi
- **Symbol**: MHD
- **Decimals**: 9
- **Total Supply**: 1,000,000 MHD (1,000,000,000,000,000 with 9 decimals)

### Fee System
- **Default Fee**: 0.1% per transfer
- **Configurable**: Admin can adjust fee percentage (0-10%)
- **Fee Collection**: All fees accumulate in the contract for admin withdrawal

### Admin Functions
- ✅ Enable/disable all transfers globally
- ✅ Change admin address
- ✅ Withdraw accumulated fees
- ✅ Mint new tokens
- ✅ Burn tokens from any address
- ✅ Freeze/unfreeze specific user accounts
- ✅ Update fee percentage

### Security Features
- ✅ Role-based access control
- ✅ Input validation for all parameters
- ✅ Maximum fee cap (10%)
- ✅ Balance checks before transfers
- ✅ Transfer status checks

## Smart Contract Architecture

### Messages
- `Transfer`: Standard token transfer with fee deduction
- `Mint`: Admin-only token minting
- `Burn`: Admin-only token burning
- `SetFee`: Update transfer fee percentage
- `ToggleTransfers`: Enable/disable all transfers
- `WithdrawFees`: Withdraw accumulated fees to admin
- `ChangeAdmin`: Transfer admin rights
- `Address`: Toggle freeze status for specific address

### Get Methods
- `get_metadata()`: Returns token metadata
- `balance_of(user)`: Returns user balance
- `get_total_supply()`: Returns total token supply
- `get_accumulated_fees()`: Returns accumulated fees
- `get_admin()`: Returns current admin address
- `are_transfers_enabled()`: Returns transfer status
- `is_user_frozen(user)`: Returns freeze status
- `get_fee_percentage()`: Returns current fee percentage

## Getting Started

### Prerequisites
- Node.js 18+ 
- TON Wallet (for testing)
- TON CLI tools

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Build the contract**:
   ```bash
   npm run build
   ```

3. **Run tests**:
   ```bash
   npm test
   ```

### Deployment

1. **Deploy to testnet**:
   ```bash
   npm run start -- deployM6hdix
   ```

2. **Deploy to mainnet**:
   ```bash
   npm run start -- deployM6hdix --mainnet
   ```

### Usage

#### Basic Token Transfer
```bash
npm run start -- transferTokens
```

#### Admin Panel
Open `admin-panel.html` in your browser to access the web interface.

## Testing

Comprehensive test suite covering:
- ✅ Contract deployment and initialization
- ✅ Token transfers with fee calculation
- ✅ Admin controls and permissions
- ✅ Fee percentage updates
- ✅ Minting and burning tokens
- ✅ Fee withdrawal
- ✅ Transfer enable/disable
- ✅ User freeze/unfreeze
- ✅ Admin address changes
- ✅ Error handling and edge cases

Run tests:
```bash
npm test
```

## Web Interface

The admin panel (`admin-panel.html`) provides:

### Dashboard
- Real-time token statistics
- Total supply display
- Admin balance tracking
- Accumulated fees overview
- Transfer status indicator

### Controls
- **Transfer Management**: Toggle global transfer status
- **Fee Configuration**: Adjust transfer fee percentage
- **Token Operations**: Mint and burn tokens
- **Admin Functions**: Change admin, withdraw fees
- **User Management**: Freeze/unfreeze specific accounts

### Features
- Responsive design with Tailwind CSS
- Real-time updates
- Error handling and notifications
- TON wallet integration
- Mobile-friendly interface

## Security Considerations

- **Access Control**: Only admin can perform sensitive operations
- **Input Validation**: All inputs are validated before processing
- **Fee Limits**: Maximum fee capped at 10%
- **Balance Checks**: Prevents overdrafts
- **Status Checks**: Transfer and freeze status verified

## API Reference

### Smart Contract Methods

#### Transfer Tokens
```typescript
const transferResult = await token.send(
    sender,
    { value: toNano('0.05') },
    {
        $$type: 'Transfer',
        to: recipientAddress,
        amount: toNano('1000'),
        response_destination: null,
        custom_payload: null,
        forward_ton_amount: 0n,
        forward_payload: Buffer.alloc(0)
    }
);
```

#### Mint Tokens (Admin Only)
```typescript
const mintResult = await token.send(
    adminSender,
    { value: toNano('0.05') },
    {
        $$type: 'Mint',
        to: recipientAddress,
        amount: toNano('1000')
    }
);
```

#### Update Fee (Admin Only)
```typescript
const feeResult = await token.send(
    adminSender,
    { value: toNano('0.05') },
    {
        $$type: 'SetFee',
        feePercentage: 50n // 0.5%
    }
);
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or support, please open an issue on GitHub or contact the development team.

---

**Note**: This is a demonstration project. For production use, ensure proper security audits and testing.
