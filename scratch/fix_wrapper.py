import re

def main():
    path = 'src/renderer/src/components/hubs/DashboardHub/DashboardHub.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the exact string we want to replace
    # We want to remove the wrapper div but keep its contents.
    
    wrapper_start = '<div className="mt-8 bg-surface-container/30 border border-outline-variant/30 rounded-2xl overflow-hidden backdrop-blur-md">'
    
    # Let's find this specific wrapper. It's in the Game Hub view.
    # We can split by this string.
    
    parts = content.split(wrapper_start)
    
    if len(parts) == 2:
        # The wrapper start is parts[1]
        # We need to find the matching closing div for this wrapper.
        # But wait, it's easier to just match the end of the block.
        # It looks like:
        #                       </div>
        #                   )}
        #                 </div>
        #               </OverlayScrollbarsComponent>
        
        # We can just replace the opening tag with an empty string,
        # and then find the closing tag and remove it.
        # But since we have the block:
        
        # Wait, the closing tag is exactly `                </div>\n              </OverlayScrollbarsComponent>`
        
        # Let's use regex to find the wrapper and remove it
        pattern = r'<div className="mt-8 bg-surface-container/30 border border-outline-variant/30 rounded-2xl overflow-hidden backdrop-blur-md">\s*(\{servers\.filter\(\(s: any\) => s\.game\.includes\(activeGameHub\)\)\.length === 0 \? \([\s\S]*?\}\)\s*</div>\s*)\s*</div>'
        
        match = re.search(pattern, content)
        if match:
            print("Found the wrapper block using regex!")
            content = content[:match.start()] + match.group(1) + content[match.end():]
            
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
        else:
            print("Regex did not match. Let's try simple string replacement.")
            
            # Since we know the exact closing structure:
            
            # The closing structure is:
            #                     </div>
            #                   )}
            #                 </div>
            #               </OverlayScrollbarsComponent>
            
            closing_pattern = r'(\s*</div>\s*\)\s*)\s*</div>\s*(</OverlayScrollbarsComponent>)'
            
            # Remove wrapper start
            content = content.replace(wrapper_start, '')
            
            # Remove wrapper end
            content = re.sub(closing_pattern, r'\1\2', content, count=1)
            
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            
    else:
        print("wrapper start not found exactly once")

main()
