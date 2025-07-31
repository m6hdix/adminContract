import "@stdlib/deploy";
import "@stdlib/ownable";

// Token metadata message
message TokenMetadata {
    name: String;
    symbol: String;
    decimals: Int as uint8;
    totalSupply: Int as coins;
}

// Transfer message
message Transfer {
    to: Address;
    amount: Int as coins;
    response_destination: Address?;
    custom_payload: Cell?;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining;
}

// Mint message (admin only)
message Mint {
    to: Address;
    amount: Int as coins;
}

// Burn message (admin only)
message Burn {
    from: Address;
    amount: Int as coins;
}

// Fee configuration message
message SetFee {
    feePercentage: Int as uint16; // Basis points (1 = 0.01%)
}

// Toggle transfers message
message ToggleTransfers {
    enabled: Bool;
}

// Withdraw fees message
message WithdrawFees {
    amount: Int as coins;
}

// Change admin message
message ChangeAdmin {
    newAdmin: Address;
}

// Freeze/unfreeze user message
message ToggleFreeze {
    user: Address;
}

// Token wallet data
struct TokenWallet {
    balance: Int as coins;
    frozen: Bool;
}

contract MahdiToken with Deployable {
    // Token constants
    name: String = "Mahdi";
    symbol: String = "MHD";
    decimals: Int as uint8 = 9;
    
    // State variables
    totalSupply: Int as coins = 1_000_000_000_000_000; // 1M tokens with 9 decimals
    feePercentage: Int as uint16 = 10; // 0.1% in basis points (10/10000)
    transfersEnabled: Bool = true;
    accumulatedFees: Int as coins = 0;
    
    // Admin address (set to deployer initially)
    admin: Address;
    
    // User balances and freeze status
    balances: map<Address, Int as coins>;
    frozenUsers: map<Address, Bool>;
    
    init() {
        self.admin = sender();
        self.balances.set(self.admin, self.totalSupply);
    }
    
    // Ensure only admin can call certain functions
    inline fun requireAdmin() {
        require(sender() == self.admin, "Only admin can perform this action");
    }
    
    // Ensure transfers are enabled and user is not frozen
    inline fun requireCanTransfer(from: Address) {
        require(self.transfersEnabled, "Token transfers are disabled");
        let frozen: Bool? = self.frozenUsers.get(from);
        let isFrozen: Bool = frozen == null ? false : frozen!!;
        require(!isFrozen, "User account is frozen");
    }
    
    // Calculate transfer fee
    inline fun calculateFee(amount: Int): Int {
        return (amount * self.feePercentage) / 10_000;
    }
    
    // Get token metadata
    get fun get_metadata(): TokenMetadata {
        return TokenMetadata{
            name: self.name,
            symbol: self.symbol,
            decimals: self.decimals,
            totalSupply: self.totalSupply
        };
    }
    
    // Get user balance
    get fun balance_of(user: Address): Int {
        let balance: Int? = self.balances.get(user);
        if (balance == null) {
            return 0;
        }
        return balance!!;
    }
    
    // Get total supply
    get fun get_total_supply(): Int {
        return self.totalSupply;
    }
    
    // Get accumulated fees
    get fun get_accumulated_fees(): Int {
        return self.accumulatedFees;
    }
    
    // Get admin address
    get fun get_admin(): Address {
        return self.admin;
    }
    
    // Check if transfers are enabled
    get fun are_transfers_enabled(): Bool {
        return self.transfersEnabled;
    }
    
    // Check if user is frozen
    get fun is_user_frozen(user: Address): Bool {
        let frozen: Bool? = self.frozenUsers.get(user);
        if (frozen == null) {
            return false;
        }
        return frozen!!;
    }
    
    // Get current fee percentage
    get fun get_fee_percentage(): Int {
        return self.feePercentage;
    }
    
    // Transfer tokens with fee deduction
    receive(msg: Transfer) {
        let from: Address = sender();
        self.requireCanTransfer(from);
        
        let fromBalance: Int? = self.balances.get(from);
        let balance: Int = fromBalance == null ? 0 : fromBalance!!;
        require(balance >= msg.amount, "Insufficient balance");
        
        let fee: Int = self.calculateFee(msg.amount);
        let netAmount: Int = msg.amount - fee;
        
        // Update balances
        self.balances.set(from, balance - msg.amount);
        let toBalanceOpt: Int? = self.balances.get(msg.to);
        let toBalance: Int = toBalanceOpt == null ? 0 : toBalanceOpt!!;
        self.balances.set(msg.to, toBalance + netAmount);
        self.accumulatedFees += fee;
        
        // Send notification if requested
        if (msg.response_destination != null) {
            send(SendParameters{
                to: msg.response_destination!!,
                value: 0,
                bounce: false,
                mode: SendRemainingValue,
                body: "Transfer completed".asComment()
            });
        }
    }
    
    // Admin: Mint new tokens
    receive(msg: Mint) {
        self.requireAdmin();
        
        self.totalSupply += msg.amount;
        let toBalanceOpt: Int? = self.balances.get(msg.to);
        let toBalance: Int = toBalanceOpt == null ? 0 : toBalanceOpt!!;
        self.balances.set(msg.to, toBalance + msg.amount);
    }
    
    // Admin: Burn tokens
    receive(msg: Burn) {
        self.requireAdmin();
        
        let fromBalance: Int? = self.balances.get(msg.from);
        let balance: Int = fromBalance == null ? 0 : fromBalance!!;
        require(balance >= msg.amount, "Insufficient balance to burn");
        
        self.balances.set(msg.from, balance - msg.amount);
        self.totalSupply -= msg.amount;
    }
    
    // Admin: Set fee percentage
    receive(msg: SetFee) {
        self.requireAdmin();
        require(msg.feePercentage <= 1000, "Fee too high (max 10%)");
        
        self.feePercentage = msg.feePercentage;
    }
    
    // Admin: Toggle transfers
    receive(msg: ToggleTransfers) {
        self.requireAdmin();
        
        self.transfersEnabled = msg.enabled;
    }
    
    // Admin: Change admin address
    receive(msg: ChangeAdmin) {
        self.requireAdmin();
        
        self.admin = msg.newAdmin;
    }
    
    // Admin: Withdraw accumulated fees
    receive(msg: WithdrawFees) {
        self.requireAdmin();
        require(msg.amount <= self.accumulatedFees, "Insufficient fees");
        
        self.accumulatedFees -= msg.amount;
        
        send(SendParameters{
            to: self.admin,
            value: msg.amount,
            bounce: false,
            mode: SendIgnoreErrors
        });
    }
    
    // Admin: Freeze/unfreeze specific user
    receive(msg: ToggleFreeze) {
        self.requireAdmin();
        
        let frozen: Bool? = self.frozenUsers.get(msg.user);
        let isFrozen: Bool = frozen == null ? false : frozen!!;
        self.frozenUsers.set(msg.user, !isFrozen);
    }
}
