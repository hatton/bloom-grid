#!/usr/bin/env bash
set -euo pipefail

# Merge the current worktree branch into the local master branch.
#
# This script is for merging a feature branch from a worktree into the local 'master' branch.
# It will only succeed if the merge is a fast-forward, meaning 'master' has not diverged.
#
# By default, it only performs the merge.
# With the --cleanup flag, it will also remove the worktree and the local branch.
#
# Pre-conditions:
# - You are running this from inside the feature worktree directory.
# - The working tree is clean (no uncommitted changes).
# - The main branch is named "master".

MAIN_BRANCH="master"
CLEANUP=false

# --- Argument Parsing ---
for arg in "$@"
do
    if [ "$arg" == "--cleanup" ]; then
        CLEANUP=true
    fi
done

# Helper functions for logging
err() { echo -e "\n\033[0;31mERROR: $*\033[0m" >&2; exit 1; }
info() { echo -e "\033[0;32m==> $*\033[0m"; }
warn() { echo -e "\033[0;33m$*\033[0m"; }

# --- Pre-flight Checks ---

# 1. Ensure we're inside a git worktree
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    err "This script must be run from within a Git worktree."
fi

# 2. Get current branch and check it's not the main branch
CURRENT_BRANCH=$(git symbolic-ref --quiet --short HEAD)
if [ -z "$CURRENT_BRANCH" ]; then
    err "Detached HEAD is not supported. Please check out a branch."
elif [ "$CURRENT_BRANCH" == "$MAIN_BRANCH" ]; then
    err "Already on '$MAIN_BRANCH'. This script is for feature branches in worktrees."
fi

# 3. Ensure the working tree is clean
if [ -n "$(git status --porcelain)" ]; then
    err "Working tree is not clean. Commit or stash your changes before merging."
fi

# --- Merge and Cleanup ---

info "Attempting to fast-forward '$MAIN_BRANCH' to '$CURRENT_BRANCH'..."

# Use 'git push' to the local repository '.' to perform a fast-forward merge first.
if git push . "HEAD:$MAIN_BRANCH" >/dev/null 2>&1; then
    info "Successfully fast-forwarded '$MAIN_BRANCH' with '$CURRENT_BRANCH'."
else
    info "Not a fast-forward merge. Attempting to create a merge commit..."
    
    # For a non-fast-forward merge, we need to find where master is checked out
    # and perform the merge there, or use a different approach.
    
    # First, let's find if master is checked out in any worktree
    MASTER_WORKTREE_PATH=""
    while IFS= read -r line; do
        case "$line" in
            worktree\ *) wt_path=${line#worktree } ;;
            branch\ refs/heads/$MAIN_BRANCH)
                MASTER_WORKTREE_PATH="$wt_path"
                break
                ;;
        esac
    done < <(git worktree list --porcelain)
    
    if [ -n "$MASTER_WORKTREE_PATH" ]; then
        # Master is checked out in a worktree, check if it's clean
        if [ -n "$(git -C "$MASTER_WORKTREE_PATH" status --porcelain)" ]; then
            err "Master worktree at '$MASTER_WORKTREE_PATH' is not clean. Aborting merge."
        fi
        
        # Perform the merge in the master worktree
        info "Merging '$CURRENT_BRANCH' into '$MAIN_BRANCH' at '$MASTER_WORKTREE_PATH'..."
        if git -C "$MASTER_WORKTREE_PATH" merge --no-ff "$CURRENT_BRANCH" -m "Merge branch '$CURRENT_BRANCH'"; then
            info "Successfully merged '$CURRENT_BRANCH' into '$MAIN_BRANCH'."
        else
            err "Merge failed. Please resolve conflicts manually."
        fi
    else
        # Master is not checked out, we can use symbolic-ref approach
        info "Master not checked out in any worktree. Using symbolic-ref merge..."
        
        # Create a temporary index and work tree to perform the merge
        TEMP_DIR=$(mktemp -d)
        export GIT_INDEX_FILE="$TEMP_DIR/index"
        export GIT_WORK_TREE="$TEMP_DIR/worktree"
        
        # Setup temporary work tree
        mkdir -p "$GIT_WORK_TREE"
        git read-tree "$MAIN_BRANCH"
        git checkout-index -a
        
        # Attempt the merge
        if git merge-tree "$(git merge-base "$MAIN_BRANCH" HEAD)" "$MAIN_BRANCH" HEAD | grep -q "<<<<<<"; then
            err "Merge conflicts detected. Please resolve manually by checking out master and merging."
        fi
        
        # Perform the merge
        MERGE_BASE=$(git merge-base "$MAIN_BRANCH" HEAD)
        TREE=$(git commit-tree "$(git rev-parse HEAD^{tree})" -p "$MAIN_BRANCH" -p HEAD -m "Merge branch '$CURRENT_BRANCH'")
        git update-ref "refs/heads/$MAIN_BRANCH" "$TREE"
        
        # Cleanup
        rm -rf "$TEMP_DIR"
        unset GIT_INDEX_FILE GIT_WORK_TREE
        
        info "Successfully merged '$CURRENT_BRANCH' into '$MAIN_BRANCH'."
    fi
fi

# --- Conditional Cleanup ---

if [ "$CLEANUP" = false ]; then
    info "Merge successful. Worktree and branch are left intact."
    exit 0
fi

info "Cleanup flag detected. Proceeding with worktree and branch removal."

# --- Detached Cleanup ---

# To remove the current worktree (which is the current working directory),
# we must create a detached script to do the work after this script exits.

WORKTREE_PATH=$(git rev-parse --show-toplevel)
MAIN_WORKTREE_PATH=$(git rev-parse --git-dir)/..
CLEANUP_SCRIPT_PATH="$MAIN_WORKTREE_PATH/cleanup-worktree.sh"

info "Creating detached cleanup script..."

# Create the cleanup script in the parent directory
cat > "$CLEANUP_SCRIPT_PATH" << EOF
#!/usr/bin/env bash
set -e

echo "Running detached cleanup..."

# Give the original terminal a moment to close
sleep 2

echo "Removing worktree at '$WORKTREE_PATH'..."
git worktree remove --force "$WORKTREE_PATH"

echo "Deleting local branch '$CURRENT_BRANCH'..."
git branch -d "$CURRENT_BRANCH"

echo "Pruning worktree metadata..."
git worktree prune

echo "Cleanup complete."

# Self-destruct the cleanup script
rm -- "\$0"
EOF

# Make the cleanup script executable
chmod +x "$CLEANUP_SCRIPT_PATH"

info "Executing cleanup in the background. This terminal will now close."
warn "VS Code may show that the folder has been deleted. You can safely close the window."

# Execute the cleanup script in a new, detached process
# nohup ensures it keeps running even after this terminal closes.
# The final '&' runs it in the background.
nohup "$CLEANUP_SCRIPT_PATH" > /dev/null 2>&1 &

# The main script now exits, allowing the VS Code terminal to close.
# The 'nohup' process will continue running in the background to do the cleanup.
exit 0

info "Switching to other worktree: $OTHER_WT"
cd "$OTHER_WT"

# Ensure the other WT is up to date before local operations
git fetch "$REMOTE" --prune || true

info "Removing worktree: $CURRENT_WT_PATH"
# Use --force in case of untracked artifacts; the repo state was checked clean earlier
git worktree remove --force "$CURRENT_WT_PATH"

info "Deleting local branch: $CURRENT_BRANCH"
if git show-ref --verify --quiet "refs/heads/$CURRENT_BRANCH"; then
  git branch -d "$CURRENT_BRANCH" || true
else
  info "Local branch $CURRENT_BRANCH not found; skipping delete."
fi

info "Pruning worktrees"
git worktree prune

info "Done. $MAIN_BRANCH on $REMOTE now points at your work; feature worktree removed."
