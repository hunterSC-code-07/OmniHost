import socket
import struct
import sys

def query_server(ip, port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(2.0)
    
    # A2S_INFO request payload
    request = b'\xFF\xFF\xFF\xFFTSource Engine Query\x00'
    
    try:
        sock.sendto(request, (ip, port))
        data, addr = sock.recvfrom(4096)
        print("Received response from server!")
        print(data)
    except socket.timeout:
        print("Query timed out. Server did not respond.")
    except Exception as e:
        print(f"Error: {e}")

query_server('127.0.0.1', 27016)
