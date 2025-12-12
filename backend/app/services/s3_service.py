"""
S3 service for handling video uploads, downloads, and deletions.
"""
import boto3
from botocore.exceptions import ClientError
from pathlib import Path
import tempfile
import os
from typing import Optional, BinaryIO
import asyncio
from functools import partial

# S3 Configuration from environment
S3_BUCKET_RAW = os.getenv("S3_BUCKET_RAW", "road-monitoring-raw")
S3_BUCKET_PROCESSED = os.getenv("S3_BUCKET_PROCESSED", "road-monitoring-processed")
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

# Create S3 client
def get_s3_client():
    """Get configured S3 client."""
    return boto3.client(
        's3',
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY
    )


class S3Service:
    """Service class for S3 operations."""
    
    def __init__(self):
        self.client = get_s3_client()
        self.raw_bucket = S3_BUCKET_RAW
        self.processed_bucket = S3_BUCKET_PROCESSED
    
    async def download_video(self, s3_key: str, local_path: Optional[str] = None) -> str:
        """
        Download video from S3 to local filesystem.
        
        Args:
            s3_key: The S3 object key
            local_path: Optional local path. If not provided, creates temp file.
            
        Returns:
            Path to downloaded file
        """
        if local_path is None:
            suffix = Path(s3_key).suffix or '.mp4'
            fd, local_path = tempfile.mkstemp(suffix=suffix)
            os.close(fd)
        
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            partial(
                self.client.download_file,
                self.raw_bucket,
                s3_key,
                local_path
            )
        )
        
        return local_path
    
    async def download_csv(self, s3_key: str, local_path: Optional[str] = None) -> str:
        """
        Download CSV from S3 to local filesystem.
        
        Args:
            s3_key: The S3 object key
            local_path: Optional local path. If not provided, creates temp file.
            
        Returns:
            Path to downloaded file
        """
        if local_path is None:
            fd, local_path = tempfile.mkstemp(suffix='.csv')
            os.close(fd)
        
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            partial(
                self.client.download_file,
                self.raw_bucket,
                s3_key,
                local_path
            )
        )
        
        return local_path
    
    async def upload_file(
        self,
        local_path: str,
        s3_key: str,
        bucket: Optional[str] = None,
        content_type: Optional[str] = None
    ) -> str:
        """
        Upload file to S3.
        
        Args:
            local_path: Path to local file
            s3_key: Target S3 key
            bucket: Target bucket (defaults to processed bucket)
            content_type: Optional content type
            
        Returns:
            S3 URI of uploaded file
        """
        bucket = bucket or self.processed_bucket
        
        extra_args = {}
        if content_type:
            extra_args['ContentType'] = content_type
        
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            partial(
                self.client.upload_file,
                local_path,
                bucket,
                s3_key,
                ExtraArgs=extra_args if extra_args else None
            )
        )
        
        return f"s3://{bucket}/{s3_key}"
    
    async def delete_object(self, s3_key: str, bucket: Optional[str] = None) -> bool:
        """
        Delete object from S3.
        
        Args:
            s3_key: The S3 object key
            bucket: Target bucket (defaults to raw bucket)
            
        Returns:
            True if successful
        """
        bucket = bucket or self.raw_bucket
        
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            partial(
                self.client.delete_object,
                Bucket=bucket,
                Key=s3_key
            )
        )
        
        return True
    
    async def delete_objects(self, s3_keys: list[str], bucket: Optional[str] = None) -> dict:
        """
        Delete multiple objects from S3.
        
        Args:
            s3_keys: List of S3 object keys
            bucket: Target bucket (defaults to raw bucket)
            
        Returns:
            Response from S3
        """
        bucket = bucket or self.raw_bucket
        
        objects = [{'Key': key} for key in s3_keys]
        
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            partial(
                self.client.delete_objects,
                Bucket=bucket,
                Delete={'Objects': objects}
            )
        )
        
        return response
    
    async def object_exists(self, s3_key: str, bucket: Optional[str] = None) -> bool:
        """
        Check if object exists in S3.
        
        Args:
            s3_key: The S3 object key
            bucket: Target bucket (defaults to raw bucket)
            
        Returns:
            True if object exists
        """
        bucket = bucket or self.raw_bucket
        
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                partial(
                    self.client.head_object,
                    Bucket=bucket,
                    Key=s3_key
                )
            )
            return True
        except ClientError:
            return False
    
    async def get_object_metadata(self, s3_key: str, bucket: Optional[str] = None) -> dict:
        """
        Get object metadata from S3.
        
        Args:
            s3_key: The S3 object key
            bucket: Target bucket (defaults to raw bucket)
            
        Returns:
            Object metadata
        """
        bucket = bucket or self.raw_bucket
        
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            partial(
                self.client.head_object,
                Bucket=bucket,
                Key=s3_key
            )
        )
        
        return {
            'content_length': response.get('ContentLength'),
            'content_type': response.get('ContentType'),
            'last_modified': response.get('LastModified'),
            'metadata': response.get('Metadata', {})
        }
    
    def generate_presigned_url(
        self,
        s3_key: str,
        bucket: Optional[str] = None,
        expiration: int = 3600
    ) -> str:
        """
        Generate a presigned URL for downloading.
        
        Args:
            s3_key: The S3 object key
            bucket: Target bucket (defaults to processed bucket)
            expiration: URL expiration time in seconds
            
        Returns:
            Presigned URL
        """
        bucket = bucket or self.processed_bucket
        
        return self.client.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': s3_key},
            ExpiresIn=expiration
        )
    
    async def list_objects(
        self,
        prefix: str = "",
        bucket: Optional[str] = None,
        max_keys: int = 1000
    ) -> list[dict]:
        """
        List objects in S3 bucket.
        
        Args:
            prefix: Key prefix filter
            bucket: Target bucket (defaults to raw bucket)
            max_keys: Maximum number of keys to return
            
        Returns:
            List of object metadata dicts
        """
        bucket = bucket or self.raw_bucket
        
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            partial(
                self.client.list_objects_v2,
                Bucket=bucket,
                Prefix=prefix,
                MaxKeys=max_keys
            )
        )
        
        objects = []
        for obj in response.get('Contents', []):
            objects.append({
                'key': obj['Key'],
                'size': obj['Size'],
                'last_modified': obj['LastModified']
            })
        
        return objects


# Singleton instance
s3_service = S3Service()


# Utility functions for direct use
async def download_video_from_s3(s3_key: str, local_path: Optional[str] = None) -> str:
    """Download video from S3."""
    return await s3_service.download_video(s3_key, local_path)


async def delete_video_from_s3(s3_key: str) -> bool:
    """Delete video from S3."""
    return await s3_service.delete_object(s3_key)


async def upload_annotated_video(local_path: str, s3_key: str) -> str:
    """Upload annotated video to processed bucket."""
    return await s3_service.upload_file(
        local_path, 
        s3_key, 
        bucket=S3_BUCKET_PROCESSED,
        content_type='video/mp4'
    )
